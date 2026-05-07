#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'yaml';

const program = new Command();

program
  .name('skill')
  .description('Skill Manager CLI - Manage and develop skills')
  .version('1.0.0');

interface InitOptions {
  name: string;
  description?: string;
  author?: string;
  template?: string;
}

interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  reporter?: string;
}

interface PublishOptions {
  version?: string;
  tag?: string;
  registry?: string;
  access?: 'public' | 'private';
}

interface ValidateOptions {
  strict?: boolean;
  warnings?: boolean;
}

const TEMPLATES = {
  basic: {
    name: 'Basic Skill',
    description: 'A simple skill template',
    files: {
      'SKILL.md': `# {{name}}

{{description}}

## Usage

Describe how to use this skill.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| input | string | Yes | Input description |

## Examples

\`\`\`json
{
  "input": "example"
}
\`\`\`
`,
      'skill.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "author": "{{author}}"
}
`,
    },
  },
  api: {
    name: 'API Skill',
    description: 'A skill that interacts with APIs',
    files: {
      'SKILL.md': `# {{name}}

{{description}}

## API Endpoints

- \`GET /api/resource\`
- \`POST /api/resource\`

## Configuration

| Variable | Description |
|----------|-------------|
| API_URL | The base URL |
| API_KEY | Your API key |
`,
      'skill.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "author": "{{author}}",
  "dependencies": {}
}
`,
    },
  },
};

class SkillCLI {
  private projectRoot: string;
  private skillsDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.skillsDir = path.join(this.projectRoot, '.claude', 'skills');
  }

  async init(options: InitOptions): Promise<void> {
    console.log(chalk.blue('Initializing new skill...'));

    const skillName = options.name || await this.promptSkillName();
    const skillDir = path.join(this.skillsDir, skillName);

    if (fs.existsSync(skillDir)) {
      console.error(chalk.red(`Skill "${skillName}" already exists`));
      process.exit(1);
    }

    const template = TEMPLATES[options.template as keyof typeof TEMPLATES] || TEMPLATES.basic;
    const description = options.description || await this.promptDescription();
    const author = options.author || await this.promptAuthor();

    fs.ensureDirSync(skillDir);

    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(skillDir, filePath);
      const interpolated = content
        .replace(/\{\{name\}\}/g, skillName)
        .replace(/\{\{description\}\}/g, description)
        .replace(/\{\{author\}\}/g, author);

      fs.writeFileSync(fullPath, interpolated);
      console.log(chalk.green(`Created: ${filePath}`));
    }

    fs.writeFileSync(
      path.join(skillDir, 'README.md'),
      `# ${skillName}

${description}

## Getting Started

1. Edit \`SKILL.md\` to define your skill
2. Run \`skill test\` to verify
3. Run \`skill publish\` to share

## Commands

- \`skill test\` - Test the skill
- \`skill validate\` - Validate the skill
- \`skill publish\` - Publish to marketplace
`
    );

    console.log(chalk.green(`\nSkill "${skillName}" initialized successfully!`));
    console.log(chalk.cyan(`\nNext steps:`));
    console.log(`  cd ${skillDir}`);
    console.log(`  skill test`);
  }

  async test(options: TestOptions): Promise<void> {
    console.log(chalk.blue('Running skill tests...'));

    const skillDir = this.projectRoot;
    const skillMd = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillMd)) {
      console.error(chalk.red('SKILL.md not found. Run from a skill directory.'));
      process.exit(1);
    }

    const tests: Test[] = [];

    console.log(chalk.green('✓ Parsing SKILL.md'));
    const content = fs.readFileSync(skillMd, 'utf-8');

    const hasTitle = /^#\s+.+/.test(content);
    const hasDescription = content.length > 50;
    const hasExamples = content.includes('```');

    if (!hasTitle) tests.push({ name: 'Has title', passed: false, error: 'Missing title (# heading)' });
    if (!hasDescription) tests.push({ name: 'Has description', passed: false, error: 'Description too short' });
    if (!hasExamples) tests.push({ name: 'Has examples', passed: false, error: 'Missing code examples' });

    const schemaTests = this.validateSchema(content);
    tests.push(...schemaTests);

    console.log('\n' + chalk.bold('Test Results:'));
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      if (test.passed) {
        console.log(chalk.green(`  ✓ ${test.name}`));
        passed++;
      } else {
        console.log(chalk.red(`  ✗ ${test.name}`));
        if (test.error) console.log(chalk.gray(`    ${test.error}`));
        failed++;
      }
    }

    console.log(`\n${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }
  }

  private validateSchema(content: string): Test[] {
    const tests: Test[] = [];

    const hasParameters = content.includes('|') && content.includes('---');
    if (hasParameters) {
      tests.push({ name: 'Has parameter table', passed: true });
    }

    return tests;
  }

  async validate(options: ValidateOptions): Promise<void> {
    console.log(chalk.blue('Validating skill...'));

    const skillDir = this.projectRoot;
    const errors: string[] = [];
    const warnings: string[] = [];

    const skillMd = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      errors.push('SKILL.md not found');
    } else {
      const content = fs.readFileSync(skillMd, 'utf-8');

      if (content.length < 100) {
        errors.push('SKILL.md content too short (< 100 characters)');
      }

      if (!content.includes('##')) {
        warnings.push('Consider adding sections (## Usage, ## Examples)');
      }

      if (!content.includes('```')) {
        warnings.push('Consider adding code examples');
      }
    }

    const skillJson = path.join(skillDir, 'skill.json');
    if (fs.existsSync(skillJson)) {
      try {
        const json = JSON.parse(fs.readFileSync(skillJson, 'utf-8'));

        if (!json.name) errors.push('skill.json: missing "name" field');
        if (!json.version) errors.push('skill.json: missing "version" field');
        if (json.version && !/^\d+\.\d+\.\d+$/.test(json.version)) {
          errors.push('skill.json: version must be semantic (x.y.z)');
        }
      } catch (e) {
        errors.push('skill.json: invalid JSON');
      }
    }

    console.log('\n' + chalk.bold('Validation Results:'));

    if (errors.length > 0) {
      console.log(chalk.red('\nErrors:'));
      errors.forEach(e => console.log(chalk.red(`  ✗ ${e}`)));
    }

    if (warnings.length > 0 && options.warnings) {
      console.log(chalk.yellow('\nWarnings:'));
      warnings.forEach(w => console.log(chalk.yellow(`  ⚠ ${w}`)));
    }

    if (errors.length === 0) {
      console.log(chalk.green('\n✓ Validation passed'));
      if (options.warnings && warnings.length === 0) {
        console.log(chalk.gray('No warnings'));
      }
    } else {
      process.exit(1);
    }
  }

  async publish(options: PublishOptions): Promise<void> {
    console.log(chalk.blue('Publishing skill...'));

    const skillDir = this.projectRoot;
    const skillJsonPath = path.join(skillDir, 'skill.json');

    if (!fs.existsSync(skillJsonPath)) {
      console.error(chalk.red('skill.json not found'));
      process.exit(1);
    }

    const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'));
    const newVersion = options.version || await this.promptVersion(skillJson.version);

    if (!options.version) {
      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: `Publish version ${newVersion}?`,
        default: true,
      }]);

      if (!confirm.proceed) {
        console.log(chalk.yellow('Publish cancelled'));
        return;
      }
    }

    skillJson.version = newVersion;
    fs.writeFileSync(skillJsonPath, JSON.stringify(skillJson, null, 2));

    console.log(chalk.green(`\nVersion ${newVersion} prepared`));
    console.log(chalk.cyan('\nNext steps:'));
    console.log('  git add .');
    console.log('  git commit -m "Release v' + newVersion + '"');
    console.log('  git tag v' + newVersion);
    console.log('  git push origin main --tags');
  }

  private async promptSkillName(): Promise<string> {
    const { name } = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Skill name:',
      validate: (v: string) => /^[a-z0-9-]+$/.test(v) || 'Use lowercase letters, numbers, and hyphens only',
    }]);
    return name;
  }

  private async promptDescription(): Promise<string> {
    const { description } = await inquirer.prompt([{
      type: 'input',
      name: 'description',
      message: 'Description:',
    }]);
    return description;
  }

  private async promptAuthor(): Promise<string> {
    const { author } = await inquirer.prompt([{
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: 'Anonymous',
    }]);
    return author;
  }

  private async promptVersion(currentVersion: string): Promise<string> {
    const { version } = await inquirer.prompt([{
      type: 'input',
      name: 'version',
      message: `Version (current: ${currentVersion}):`,
      default: currentVersion,
      validate: (v: string) => /^\d+\.\d+\.\d+$/.test(v) || 'Must be semantic version (x.y.z)',
    }]);
    return version;
  }
}

interface Test {
  name: string;
  passed: boolean;
  error?: string;
}

const cli = new SkillCLI();

program
  .command('init [name]')
  .description('Initialize a new skill')
  .option('-n, --name <name>', 'Skill name')
  .option('-d, --description <description>', 'Skill description')
  .option('-a, --author <author>', 'Author name')
  .option('-t, --template <template>', 'Template to use (basic, api)', 'basic')
  .action(async (name, options) => {
    await cli.init({ name, ...options });
  });

program
  .command('test')
  .description('Test the current skill')
  .option('-w, --watch', 'Watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .option('-r, --reporter <reporter>', 'Test reporter', 'spec')
  .action(async (options) => {
    await cli.test(options);
  });

program
  .command('validate')
  .description('Validate the current skill')
  .option('-s, --strict', 'Treat warnings as errors')
  .option('-w, --warnings', 'Show warnings')
  .action(async (options) => {
    await cli.validate(options);
  });

program
  .command('publish')
  .description('Publish the current skill')
  .option('-v, --version <version>', 'Version to publish')
  .option('-t, --tag <tag>', 'Distribution tag', 'latest')
  .option('-r, --registry <registry>', 'Registry URL')
  .option('-a, --access <access>', 'Access (public or private)')
  .action(async (options) => {
    await cli.publish(options);
  });

program
  .command('list')
  .description('List all installed skills')
  .action(() => {
    const skillsDir = path.join(process.cwd(), '.claude', 'skills');
    if (!fs.existsSync(skillsDir)) {
      console.log(chalk.yellow('No skills found'));
      return;
    }

    const skills = fs.readdirSync(skillsDir);
    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found'));
      return;
    }

    console.log(chalk.bold('\nInstalled Skills:\n'));
    skills.forEach(skill => {
      const skillJsonPath = path.join(skillsDir, skill, 'skill.json');
      if (fs.existsSync(skillJsonPath)) {
        const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'));
        console.log(chalk.green(`  ${skill}`) + chalk.gray(` v${skillJson.version}`));
        if (skillJson.description) {
          console.log(chalk.gray(`    ${skillJson.description}`));
        }
      } else {
        console.log(chalk.green(`  ${skill}`));
      }
    });
    console.log();
  });

program
  .command('install <url>')
  .description('Install a skill from URL')
  .option('-p, --path <path>', 'Install path')
  .action(async (url, options) => {
    console.log(chalk.blue(`Installing from ${url}...`));
    console.log(chalk.yellow('This would call the Tauri backend to install the skill'));
  });

program
  .command('uninstall <name>')
  .description('Uninstall a skill')
  .action(async (name) => {
    const confirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: `Uninstall "${name}"?`,
      default: false,
    }]);

    if (confirm.proceed) {
      console.log(chalk.blue(`Uninstalling ${name}...`));
      console.log(chalk.yellow('This would call the Tauri backend to uninstall the skill'));
    }
  });

program.parse(process.argv);