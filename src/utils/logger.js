const chalk = require('chalk');
const ora = require('ora');

const logger = {
  info: (msg) => console.log(chalk.cyan('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✔'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✖'), msg),
  step: (num, msg) => console.log(chalk.cyan(`\n[${num}]`), chalk.bold(msg)),
  dim: (msg) => console.log(chalk.dim(msg)),
  bold: (msg) => console.log(chalk.bold(msg)),
  link: (url) => console.log(chalk.underline.cyan(url)),
  code: (code) => console.log(chalk.gray(`  ${code}`)),
  blank: () => console.log(''),
};

const spinner = (text) => {
  return ora({ text, color: 'cyan' }).start();
};

const banner = () => {
  console.log('');
  console.log(chalk.bold.cyan('  ╔═══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║') + chalk.bold.white('          spinup v2.0.0              ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ║') + chalk.dim('   Your AI coding environment, ready   ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('  ╚═══════════════════════════════════════╝'));
  console.log('');
};

module.exports = { logger, spinner, banner };
