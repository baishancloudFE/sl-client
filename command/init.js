const fs = require('fs')
const npm = require('npm')
const path = require('path')
const inquirer = require('inquirer')
const {exec} = require('child_process')

module.exports = function() {
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

  inquirer.prompt(questions).then(answers => {
    const {name, type} = answers
    const callback = initCallback(answers)
    const response = require('../config').template[answers.type]

    console.log(`> Cloning into '\u001b[94m${name}\u001b[39m' from '\u001b[94m${response}\u001b[39m'...`)
    return exec(`git clone ${response} ${path.join(process.cwd(), name)}`, (err, stdout, stderr) => {
      if (err) {
        console.error('\u001b[31m> Failed to git clone!\n\u001b[39m')
        throw err
      }

      const appPath = path.join(process.cwd(), name)
      const dependencies = Object.keys(require(appPath + '/package.json').dependencies)
      const gitPath = path.join(appPath, '.git')

      exec(process.platform === 'win32' ? `rd /s /q "${gitPath}"` : `rm -rf ${gitPath}`, (err, stdout, stderr) => {
        if (err) console.log('\u001b[33m> Failed to remove \'.git\' directory! Please delete manually.\u001b[39m')

        console.log('\u001b[32m> Done.\n\u001b[39m')
        callback()
      })
    })
  })
}

function initCallback({name, type}) {
  switch(type) {
    case 'iGroot Project':
      return () => {
        console.log('please run:', `\u001b[94m\n   cd ${name} & sl dev\u001b[39m`)
      }

    case 'iGroot Business Component':
      return () => {
        console.log('\u001b[94mif you need to develop and debugging the iGroot business component, please run:\u001b[39m')
        console.log(`\u001b[94m\n   cd ${name}\n   npm install\n   sl dev\u001b[39m`)
      }
  }
}