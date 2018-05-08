module.exports = function() {
  const fs = require('fs')
  const npm = require('npm')
  const path = require('path')
  const chalk = require('chalk')
  const inquirer = require('inquirer')
  const {exec} = require('child_process')

  const questions = [{
    type: 'list',
    name: 'type',
    message: 'What project type do you need?',
    choices: ['iGroot Project', 'iGroot Business Component']
  }, {
    type: 'input',
    name: 'name',
    message: 'What\'s your project name?',
    validate: function (value) {
      if (value.trim().length !== 0)
        return true

      return 'Please enter your project name.'
    },

    filter: function (value) {
      return value.trim()
    }
  }]

  inquirer.prompt(questions).then(async answers => {
    const {name, type} = answers
    const callback = initCallback(answers)
    const config = await _require('/config')
    const response = config.template[answers.type]

    console.log(chalk.gray(`> Cloning into '${chalk.cyan(name)}' from '${chalk.cyan(response)}'...`))
    return exec(`git clone ${response} ${path.join(process.cwd(), name)}`, (err, stdout, stderr) => {
      if (err) {
        console.error(chalk.red('> Failed to git clone!\n'))
        throw err
      }

      const appPath = path.join(process.cwd(), name)
      const dependencies = Object.keys(require(appPath + '/package.json').dependencies)
      const gitPath = path.join(appPath, '.git')

      exec(process.platform === 'win32' ? `rd /s /q "${gitPath}"` : `rm -rf ${gitPath}`, (err, stdout, stderr) => {
        if (err) console.log(chalk.red('> Failed to remove \'.git\' directory! Please delete manually.'))

        console.log(chalk.green('> Done.\n'))
        callback()
      })
    })
  })

  function initCallback({name, type}) {
    switch(type) {
      case 'iGroot Project':
        return () => {
          console.log('please run:', chalk.cyan(`\n   cd ${name} & sl dev`))
        }

      case 'iGroot Business Component':
        return () => {
          console.log(chalk.cyan('if you need to develop and debugging the iGroot business component, please run:'))
          console.log(chalk.cyan(`\n   cd ${name}\n   npm install\n   sl dev`))
        }
    }
  }
}