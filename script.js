document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('login-btn');
  const showRegisterBtn = document.getElementById('show-register-btn');
  const registerBtn = document.getElementById('register-btn');
  const cancelRegisterBtn = document.getElementById('cancel-register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const machineForm = document.getElementById('machine-form');
  const machineContainer = document.getElementById('machine-container');
  const loginContainer = document.getElementById('login-container');
  const registerContainer = document.getElementById('register-container');
  const messageContainer = document.getElementById('message-container'); // Container para mostrar mensagens de feedback

  // Mostrar o formulário de registro
  showRegisterBtn.addEventListener('click', function() {
      loginContainer.style.display = 'none';
      registerContainer.style.display = 'block';
  });

  // Cancelar o registro e voltar ao login
  cancelRegisterBtn.addEventListener('click', function() {
      registerContainer.style.display = 'none';
      loginContainer.style.display = 'block';
  });

  // Login
  loginBtn.addEventListener('click', function() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              loginContainer.style.display = 'none';
              machineContainer.style.display = 'block';
              document.getElementById('user-display').textContent = `Usuário: ${data.username}`;
              fetchMachines(); // Carregar as máquinas após o login
          } else {
              document.getElementById('login-error').textContent = data.message;
              document.getElementById('login-error').style.display = 'block';
          }
      });
  });

  // Registro de novo usuário
  registerBtn.addEventListener('click', function() {
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;
      const accessLevel = document.getElementById('register-access').value;

      fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password, access_level: accessLevel })
      })
      .then(response => response.json())
      .then(data => {
          if (data.id) {
              registerContainer.style.display = 'none';
              loginContainer.style.display = 'block';
          } else {
              document.getElementById('register-error').textContent = data.message;
              document.getElementById('register-error').style.display = 'block';
          }
      });
  });

  // Logout
  logoutBtn.addEventListener('click', function() {
      loginContainer.style.display = 'block';
      machineContainer.style.display = 'none';
  });

  // Função para carregar a lista de máquinas
  function fetchMachines() {
      fetch('http://localhost:3000/machines')
          .then(response => response.json())
          .then(data => {
              const tbody = document.getElementById('machine-list').getElementsByTagName('tbody')[0];
              tbody.innerHTML = ''; // Limpa a tabela
              data.forEach(machine => {
                  const row = tbody.insertRow();
                  row.insertCell(0).textContent = machine.cod;
                  row.insertCell(1).textContent = machine.productName;
                  row.insertCell(2).textContent = machine.reference;
                  row.insertCell(3).textContent = machine.stockLocation;
                  row.insertCell(4).textContent = machine.obs;
                  const actionsCell = row.insertCell(5);
                  actionsCell.innerHTML = `
                      <button onclick="editMachine(${machine.id})">Editar</button>
                      <button onclick="deleteMachine(${machine.id})">Excluir</button>
                      <button onclick="maintenaceMachine(${machine.id})">Manutenções</button>
                  `;
              });
          });
  }

// Função para editar uma máquina
window.editMachine = function(id) {
  fetch(`http://localhost:3000/machines/${id}`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao buscar máquina. Código HTTP: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    document.getElementById('machine-id').value = data.id;
    document.getElementById('machine-cod').value = data.cod;
    document.getElementById('machine-product-name').value = data.productName;
    document.getElementById('machine-reference').value = data.reference;
    document.getElementById('machine-stock-location').value = data.stockLocation;
    document.getElementById('machine-obs').value = data.obs;
    machineContainer.style.display = 'block';
  })
  .catch(error => {
    console.error('Erro ao buscar máquina:', error);
    alert('Ocorreu um erro ao buscar os detalhes da máquina.');
  });

}


  // Função para excluir uma máquina
  window.deleteMachine = function(id) {
      fetch(`http://localhost:3000/machines/${id}`, {
          method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
          showMessage(data.message); // Mostrar mensagem de sucesso ou erro
          fetchMachines(); // Atualiza a lista de máquinas
      });
  }

  // Manipulação do formulário de máquina
  machineForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const id = document.getElementById('machine-id').value;
      const cod = document.getElementById('machine-cod').value;
      const productName = document.getElementById('machine-product-name').value;
      const reference = document.getElementById('machine-reference').value;
      const stockLocation = document.getElementById('machine-stock-location').value;
      const obs = document.getElementById('machine-obs').value;

      const method = id ? 'PUT' : 'POST';
      const url = id ? `http://localhost:3000/machines/${id}` : 'http://localhost:3000/machines';

      fetch(url, {
          method: method,
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cod, productName, reference, stockLocation, obs })
      })
      .then(response => response.json())
      .then(data => {
          showMessage(data.message); // Mostrar mensagem de sucesso ou erro
          fetchMachines(); // Atualiza a lista de máquinas
          document.getElementById('machine-form').reset();
          document.getElementById('machine-id').value = '';
      });
  });

  // Cancelar o formulário de máquina
  document.getElementById('cancel-machine-btn').addEventListener('click', function() {
      machineContainer.style.display = 'none';
  });

  // Função para mostrar mensagens de feedback
  function showMessage(message) {
      messageContainer.textContent = message;
      messageContainer.style.display = 'block';
      setTimeout(() => {
          messageContainer.style.display = 'none';
      }, 3000); // Oculta a mensagem após 3 segundos
  }
});
