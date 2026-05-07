use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use ws::{CloseCode, Handler, Handshake, Message, Server, Sender};

#[derive(Debug, Serialize, Deserialize)]
pub struct McpToolParameter {
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub param_type: String,
    pub required: Option<bool>,
    pub enum_values: Option<Vec<String>>,
    pub properties: Option<HashMap<String, McpToolParameter>>,
    pub items: Option<Box<McpToolParameter>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub parameters: Vec<McpToolParameter>,
    #[serde(rename = "returnType")]
    pub return_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpServerInfo {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub tools: Vec<McpTool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpInvokeRequest {
    #[serde(rename = "toolName")]
    pub tool_name: String,
    pub arguments: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpInvokeResponse {
    pub success: bool,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpMessage {
    #[serde(rename = "type")]
    pub message_type: String,
    #[serde(rename = "requestId")]
    pub request_id: Option<String>,
    pub payload: Option<serde_json::Value>,
    pub error: Option<McpError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpError {
    pub code: String,
    pub message: String,
    pub details: Option<HashMap<String, serde_json::Value>>,
}

pub type ToolHandler =
    Box<dyn Fn(McpInvokeRequest) -> Result<McpInvokeResponse, McpError> + Send + Sync + 'static>;

pub struct McpServerState {
    tools: Arc<RwLock<HashMap<String, (McpTool, ToolHandler)>>,
}

impl McpServerState {
    pub fn new() -> Self {
        let mut tools = HashMap::new();

        tools.insert(
            "execute_skill".to_string(),
            (
                McpTool {
                    name: "execute_skill".to_string(),
                    description: "Execute a skill with input parameters".to_string(),
                    parameters: vec![
                        McpToolParameter {
                            name: "skillId".to_string(),
                            description: "The ID of the skill to execute".to_string(),
                            param_type: "string".to_string(),
                            required: Some(true),
                            enum_values: None,
                            properties: None,
                            items: None,
                        },
                        McpToolParameter {
                            name: "skillPath".to_string(),
                            description: "The path to the skill directory".to_string(),
                            param_type: "string".to_string(),
                            required: Some(true),
                            enum_values: None,
                            properties: None,
                            items: None,
                        },
                        McpToolParameter {
                            name: "input".to_string(),
                            description: "Input parameters for the skill".to_string(),
                            param_type: "string".to_string(),
                            required: Some(false),
                            enum_values: None,
                            properties: None,
                            items: None,
                        },
                        McpToolParameter {
                            name: "variables".to_string(),
                            description: "Additional variables for the skill".to_string(),
                            param_type: "object".to_string(),
                            required: Some(false),
                            enum_values: None,
                            properties: None,
                            items: None,
                        },
                    ],
                    return_type: Some("object".to_string()),
                },
                Box::new(|request| execute_skill_handler(request)),
            ),
        );

        tools.insert(
            "list_skills".to_string(),
            (
                McpTool {
                    name: "list_skills".to_string(),
                    description: "List all available skills".to_string(),
                    parameters: vec![],
                    return_type: Some("array".to_string()),
                },
                Box::new(|_request| list_skills_handler()),
            ),
        );

        tools.insert(
            "scan_skill".to_string(),
            (
                McpTool {
                    name: "scan_skill".to_string(),
                    description: "Scan a skill for security issues".to_string(),
                    parameters: vec![
                        McpToolParameter {
                            name: "skillPath".to_string(),
                            description: "The path to the skill directory".to_string(),
                            param_type: "string".to_string(),
                            required: Some(true),
                            enum_values: None,
                            properties: None,
                            items: None,
                        },
                        McpToolParameter {
                            name: "skillId".to_string(),
                            description: "The ID of the skill".to_string(),
                            param_type: "string".to_string(),
                            required: Some(true),
                            enum_values: None,
                            properties: None,
                            items: None,
                        },
                    ],
                    return_type: Some("object".to_string()),
                },
                Box::new(|request| scan_skill_handler(request)),
            ),
        );

        McpServerState {
            tools: Arc::new(RwLock::new(tools)),
        }
    }

    pub async fn get_server_info(&self) -> McpServerInfo {
        let tools = self.tools.read().await;
        McpServerInfo {
            name: "Skill Manager MCP".to_string(),
            version: "1.0.0".to_string(),
            description: Some("MCP server for Skill Manager".to_string()),
            tools: tools.values().map(|(tool, _)| tool.clone()).collect(),
        }
    }

    pub async fn invoke_tool(&self, request: McpInvokeRequest) -> McpInvokeResponse {
        let tools = self.tools.read().await;
        if let Some((_, handler)) = tools.get(&request.tool_name) {
            match handler(request) {
                Ok(response) => response,
                Err(error) => McpInvokeResponse {
                    success: false,
                    result: None,
                    error: Some(error.message),
                },
            }
        } else {
            McpInvokeResponse {
                success: false,
                result: None,
                error: Some(format!("Tool {} not found", request.tool_name)),
            }
        }
    }
}

fn execute_skill_handler(request: McpInvokeRequest) -> Result<McpInvokeResponse, McpError> {
    let skill_id = request
        .arguments
        .get("skillId")
        .and_then(|v| v.as_str())
        .ok_or(McpError {
            code: "missing_param".to_string(),
            message: "skillId is required".to_string(),
            details: None,
        })?;

    let skill_path = request
        .arguments
        .get("skillPath")
        .and_then(|v| v.as_str())
        .ok_or(McpError {
            code: "missing_param".to_string(),
            message: "skillPath is required".to_string(),
            details: None,
        })?;

    let input = request.arguments.get("input").and_then(|v| v.as_str()).unwrap_or("");

    let result = execute_skill_internal(skill_id, skill_path, input);

    Ok(McpInvokeResponse {
        success: result.success,
        result: result.output.map(|o| serde_json::Value::String(o)),
        error: result.error,
    })
}

fn list_skills_handler() -> Result<McpInvokeResponse, McpError> {
    match crate::scan_skills() {
        Ok(result) => Ok(McpInvokeResponse {
            success: true,
            result: Some(serde_json::to_value(result).map_err(|e| McpError {
                code: "serialization_error".to_string(),
                message: e.to_string(),
                details: None,
            })?),
            error: None,
        }),
        Err(e) => Ok(McpInvokeResponse {
            success: false,
            result: None,
            error: Some(e),
        }),
    }
}

fn scan_skill_handler(request: McpInvokeRequest) -> Result<McpInvokeResponse, McpError> {
    let skill_path = request
        .arguments
        .get("skillPath")
        .and_then(|v| v.as_str())
        .ok_or(McpError {
            code: "missing_param".to_string(),
            message: "skillPath is required".to_string(),
            details: None,
        })?;

    let skill_id = request
        .arguments
        .get("skillId")
        .and_then(|v| v.as_str())
        .ok_or(McpError {
            code: "missing_param".to_string(),
            message: "skillId is required".to_string(),
            details: None,
        })?;

    match crate::scan_skill_security(crate::SecurityScanRequest {
        skill_path: skill_path.to_string(),
        skill_id: skill_id.to_string(),
    }) {
        Ok(report) => Ok(McpInvokeResponse {
            success: true,
            result: Some(serde_json::to_value(report).map_err(|e| McpError {
                code: "serialization_error".to_string(),
                message: e.to_string(),
                details: None,
            })?),
            error: None,
        }),
        Err(e) => Ok(McpInvokeResponse {
            success: false,
            result: None,
            error: Some(e),
        }),
    }
}

struct ExecuteResult {
    success: bool,
    output: Option<String>,
    error: Option<String>,
}

fn execute_skill_internal(skill_id: &str, skill_path: &str, input: &str) -> ExecuteResult {
    let skill_path = std::path::PathBuf::from(skill_path);

    if !skill_path.exists() {
        return ExecuteResult {
            success: false,
            output: None,
            error: Some(format!("Skill path does not exist: {}", skill_path.display())),
        };
    }

    let skill_md_path = skill_path.join("SKILL.md");
    if !skill_md_path.exists() {
        return ExecuteResult {
            success: false,
            output: None,
            error: Some("SKILL.md not found".to_string()),
        };
    }

    match std::fs::read_to_string(&skill_md_path) {
        Ok(content) => ExecuteResult {
            success: true,
            output: Some(format!(
                "Executed skill: {}\nInput: {}\n\nSkill content preview:\n{}",
                skill_id,
                input,
                content.chars().take(500).collect::<String>()
            )),
            error: None,
        },
        Err(e) => ExecuteResult {
            success: false,
            output: None,
            error: Some(format!("Failed to read SKILL.md: {}", e)),
        },
    }
}

struct McpWebSocketHandler {
    out: Sender,
    state: Arc<McpServerState>,
}

impl Handler for McpWebSocketHandler {
    fn on_open(&mut self, _shake: Handshake) -> ws::Result<()> {
        Ok(())
    }

    fn on_message(&mut self, msg: Message) -> ws::Result<()> {
        let state = self.state.clone();

        tokio::spawn(async move {
            let response = match process_message(msg, state).await {
                Ok(r) => r,
                Err(e) => serde_json::to_string(&McpMessage {
                    message_type: "error".to_string(),
                    request_id: None,
                    payload: None,
                    error: Some(McpError {
                        code: "internal_error".to_string(),
                        message: e.to_string(),
                        details: None,
                    }),
                })
                .unwrap_or_else(|_| "{\"type\":\"error\",\"error\":{\"code\":\"serialization_error\",\"message\":\"Failed to serialize error\"}}".to_string()),
            };

            if let Err(e) = self.out.send(response) {
                eprintln!("Failed to send response: {}", e);
            }
        });

        Ok(())
    }

    fn on_close(&mut self, code: CloseCode, reason: &str) {
        println!("WebSocket closed: {:?} {}", code, reason);
    }
}

async fn process_message(msg: Message, state: Arc<McpServerState>) -> Result<String, String> {
    let text = msg.as_text()?;

    let mut message: McpMessage = serde_json::from_str(text)
        .map_err(|e| format!("Failed to parse message: {}", e))?;

    let request_id = message.request_id.clone();

    let response = match message.message_type.as_str() {
        "ping" => McpMessage {
            message_type: "pong".to_string(),
            request_id,
            payload: Some(serde_json::json!({ "status": "ok" })),
            error: None,
        },
        "server_info" => {
            let info = state.get_server_info().await;
            McpMessage {
                message_type: "server_info".to_string(),
                request_id,
                payload: Some(serde_json::to_value(info).map_err(|e| format!("Failed to serialize server info: {}", e))?),
                error: None,
            }
        }
        "invoke" => {
            let request: McpInvokeRequest = serde_json::from_value(message.payload.ok_or("Missing payload")?)
                .map_err(|e| format!("Failed to parse invoke request: {}", e))?;

            let result = state.invoke_tool(request).await;

            McpMessage {
                message_type: "result".to_string(),
                request_id,
                payload: Some(serde_json::to_value(result).map_err(|e| format!("Failed to serialize result: {}", e))?),
                error: None,
            }
        }
        _ => McpMessage {
            message_type: "error".to_string(),
            request_id,
            payload: None,
            error: Some(McpError {
                code: "invalid_message_type".to_string(),
                message: format!("Unknown message type: {}", message.message_type),
                details: None,
            }),
        },
    };

    serde_json::to_string(&response).map_err(|e| format!("Failed to serialize response: {}", e))
}

pub async fn start_mcp_server(bind_address: &str) -> Result<(), String> {
    let state = Arc::new(McpServerState::new());

    let server = Server::new(|out| McpWebSocketHandler {
        out,
        state: state.clone(),
    })
    .map_err(|e| format!("Failed to create server: {}", e))?;

    println!("MCP server starting on {}", bind_address);

    server
        .listen(bind_address)
        .map_err(|e| format!("Failed to listen on {}: {}", bind_address, e))?;

    Ok(())
}

pub async fn start_mcp_server_in_background(bind_address: &str) {
    tokio::spawn(async move {
        if let Err(e) = start_mcp_server(bind_address).await {
            eprintln!("MCP server error: {}", e);
        }
    });
}