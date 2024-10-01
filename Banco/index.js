const inquirer = require('inquirer')
const chalk = require('chalk')

const fs = require('fs')

operation()

function operation() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que você deseja fazer?',
        choices: [
          'Criar conta',
          'Consultar Saldo',
          'Depositar',
          'Sacar',
          'Transferir',
          'Sair',
        ],
      },
    ])
    .then((answer) => {
      const action = answer['action']

      if (action === 'Criar conta') {
        createAccount()
      } else if (action === 'Depositar') {
        deposit()
      } else if (action === 'Consultar Saldo') {
        getAccountBalance()
      } else if (action === 'Sacar') {
        withdraw()
      } else if (action === 'Transferir') {
        transfer()
      } else if (action === 'Sair') {
        console.log(chalk.bgBlue.black('Obrigado por usar o Accounts!'))
        process.exit()
      }
    })
}

// create user account
function createAccount() {
  console.log(chalk.bgGreen.black('Parabéns por escolher nosso banco!'))
  console.log(chalk.green('Defina as opções da sua conta a seguir'))

  buildAccount()
}

function buildAccount() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Digite um nome para a sua conta:',
      },
    ])
    .then((answer) => {
      console.info(answer['accountName'])

      const accountName = answer['accountName']

      if (!fs.existsSync('accounts')) {
        fs.mkdirSync('accounts')
      }

      if (fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(
          chalk.bgRed.black('Esta conta já existe, escolha outro nome!'),
        )
        buildAccount(accountName)
      }

      fs.writeFileSync(
        `accounts/${accountName}.json`,
        '{"balance":0}',
        function (err) {
          console.log(err)
        },
      )

      console.log(chalk.green('Parabéns, sua conta foi criada!'))
      operation()
    })
}

// add an amount to user account
function deposit() {
  inquirer
    .prompt([
      {
        name: 'accountName',
        message: 'Qual o nome da sua conta?',
      },
    ])
    .then((answer) => {
      const accountName = answer['accountName']

      if (!checkAccount(accountName)) {
        return deposit()
      }

      inquirer
        .prompt([
          {
            name: 'amount',
            message: 'Quanto você deseja depositar?',
          },
        ])
        .then((answer) => {
          const amount = answer['amount']

          addAmount(accountName, amount)
          operation()
        })
    })
}

function checkAccount(accountName) {
  if (!fs.existsSync(`accounts/${accountName}.json`)) {
    console.log(chalk.bgRed.black('Esta conta não existe, escolha outro nome!'))
    return false
  }
  return true
}

function getAccount(accountName) {
  const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
    encoding: 'utf8',
    flag: 'r',
  })

  return JSON.parse(accountJSON)
}

function addAmount(accountName, amount) {
  const accountData = getAccount(accountName)

  if (!amount) {
    console.log(
      chalk.bgRed.black('Ocorreu um erro, tente novamente mais tarde!'),
    )
    return deposit()
  }

  accountData.balance = parseFloat(amount) + parseFloat(accountData.balance)

  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    function (err) {
      console.log(err)
    },
  )

  console.log(
    chalk.green(`Foi depositado o valor de R$${amount} na sua conta!`),
  )
}

function getAccountBalance(){
  inquirer.prompt([
    {
      name: 'accountName',
      message: 'Qual o nome da sua conta?'
    }

  ]).then((answer) => {

    const accountName = answer["accountName"]

    //verifiy if account exist
    if(!checkAccount(accountName)){
      return getAccountBalance()
    }

    const accountData = getAccount(accountName)

    console.log(chalk.bgBlue.black(
      `Olá ${accountName}, o saldo de sua conta é R$${accountData.balance}`
    ),
  )
    operation()
  }).catch(err => console.log(err))
}

//withdraw the amount of money user asks
function withdraw(){
  inquirer.prompt([
    {
      name: 'accountName',
      message: 'Informe o nome da sua conta'
    }
  ]).then((answer) => {
    const accountName = answer['accountName']

    if(!checkAccount(accountName)){
      return withdraw()
    }

    inquirer.prompt([
      {
        name: 'amount',
        message: 'Qual o valor do saque?'
      }
    ]).then((answer) => {
      const amount = answer['amount']

      removeAmount(accountName, amount)
    })

  }).catch(err => console.log(err))
}

function removeAmount (accountName, amount){
  const accountData = getAccount(accountName)

  if(!amount){
    console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente mais tarde!'),
    )
    return(withdraw)
  }

  if(accountData.balance < amount){
    console.log(chalk.bgRed.black('Valor indisponível!'),
    )
    return withdraw()
  }

  accountData.balance = parseFloat(accountData.balance) - parseFloat(amount)

  fs.writeFileSync(
    `accounts/${accountName}.json`,
    JSON.stringify(accountData),
    function (err){
      console.log(err)
    }
  )

  console.log(chalk.green(`Foi realizado um saque de R$${amount} de sua conta!`)
)
  operation()
}

// transfer money between accounts
function transfer() {
  inquirer
    .prompt([
      {
        name: 'fromAccount',
        message: 'Informe o nome da sua conta (origem):',
      },
    ])
    .then((answer) => {
      const fromAccount = answer['fromAccount'];

      if (!checkAccount(fromAccount)) {
        return transfer();
      }

      inquirer
        .prompt([
          {
            name: 'toAccount',
            message: 'Informe o nome da conta de destino:',
          },
        ])
        .then((answer) => {
          const toAccount = answer['toAccount'];

          if (!checkAccount(toAccount)) {
            return transfer();
          }

          inquirer
            .prompt([
              {
                name: 'amount',
                message: 'Qual o valor que deseja transferir?',
              },
            ])
            .then((answer) => {
              const amount = answer['amount'];

              if (!amount || isNaN(amount)) {
                console.log(
                  chalk.bgRed.black('O valor informado não é válido!')
                );
                return transfer();
              }

              // Realiza a transferência
              performTransfer(fromAccount, toAccount, amount);
            });
        });
    });
}

function performTransfer(fromAccount, toAccount, amount) {
  const fromAccountData = getAccount(fromAccount);
  const toAccountData = getAccount(toAccount);

  if (fromAccountData.balance < amount) {
    console.log(
      chalk.bgRed.black('Saldo insuficiente para realizar a transferência!')
    );
    return operation();
  }

  // Subtrai o valor da conta de origem
  fromAccountData.balance = parseFloat(fromAccountData.balance) - parseFloat(amount);

  // Adiciona o valor à conta de destino
  toAccountData.balance = parseFloat(toAccountData.balance) + parseFloat(amount);

  // Atualiza as contas
  fs.writeFileSync(
    `accounts/${fromAccount}.json`,
    JSON.stringify(fromAccountData),
    function (err) {
      console.log(err);
    }
  );

  fs.writeFileSync(
    `accounts/${toAccount}.json`,
    JSON.stringify(toAccountData),
    function (err) {
      console.log(err);
    }
  );

  console.log(
    chalk.green(
      `Transferência de R$${amount} realizada com sucesso de ${fromAccount} para ${toAccount}!`
    )
  );

  operation();
}
