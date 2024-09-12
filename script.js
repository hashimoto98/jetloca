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
  const createMaintenanceBtn = document.getElementById('create-maintenance-btn');
  const maintenanceFormContainer = document.querySelector('.maintenance-form-container');
  const cancelMaintenanceBtn = document.getElementById('cancel-maintenance-btn');
  const maintenanceForm = document.getElementById('maintenance-form');
  const urlParams = new URLSearchParams(window.location.search);
  
 
  // Função para redirecionar para a página de manutenções
window.maintenaceMachine = function(machineId) {
  window.location.href = `maintenance.html?machineId=${machineId}`; 
};
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
  //função de exibir o indicator
  function showLoadingIndicator() {
    const loader = document.querySelector('.loader'); 
    if (loader) {
      loader.style.display = 'block'; // Exibe o elemento loader
    }
  }
  //função de ocultar o indicator
  function hideLoadingIndicator() {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.style.display = 'none'; // Oculta o elemento loader
    }
  }
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
                      <button onclick="editMachine(${machine.cod})">Editar</button>
                      <button onclick="deleteMachine(${machine.id})">Excluir</button>
                      <button onclick="maintenaceMachine(${machine.id})">Manutenções</button>
                  `;
              });
          });
  }

  window.editMachine = function(cod) {
    // Exibir um indicador de carregamento
    showLoadingIndicator();
  
    fetch(`http://localhost:3000/machines/cod/${cod}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Máquina não encontrada.');
          } else if (response.status === 500) {
            throw new Error('Ocorreu um erro no servidor. Tente novamente mais tarde.');
          } else {
            throw new Error('Erro ao buscar máquina. Código HTTP: ' + response.status);
          }
        }
        return response.json();
      })
      .then(data => {
        // Preencher o formulário de inclusão de máquinas
        document.getElementById('machine-id').value = data.id; 
        document.getElementById('machine-cod').value = data.cod;
        document.getElementById('machine-product-name').value = data.productName;
        document.getElementById('machine-reference').value = data.reference;
        document.getElementById('machine-stock-location').value = data.stockLocation;
        document.getElementById('machine-obs').value = data.obs;
  
        // Opcional: exibir o formulário de inclusão de máquinas se ele estiver oculto
        document.getElementById('machine-form').style.display = 'block';
  
        // Ocultar o indicador de carregamento
        hideLoadingIndicator();
      })
      .catch(error => {
        console.error('Erro ao buscar máquina:', error);
        alert(error.message);
  
        // Ocultar o indicador de carregamento
        hideLoadingIndicator();
      });
  };
  
  // Função para atualizar os dados da máquina no banco de dados
  function updateMachine(cod) {
    // Coletar os dados do formulário
    const formData = new FormData(document.getElementById('machine-form'));
    const updatedMachineData = {
      cod: formData.get('cod'), 
      productName: formData.get('productName'),
      reference: formData.get('reference'),
      stockLocation: formData.get('stockLocation'),
      obs: formData.get('obs')
    };
  
    // Obter o ID da máquina do campo oculto no formulário
    const machineId = document.getElementById('machine-id').value; 
  
    // Enviar os dados editados para o servidor usando fetch, usando o 'id' na URL
    fetch(`http://localhost:3000/machines/${machineId}`, { 
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedMachineData)
    })
    .then(response => {
      if (!response.ok) {
        // Lidar com a resposta de erro do servidor
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Erro ao atualizar máquina. Código HTTP: ' + response.status);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log(data.message); 
      // Limpar o formulário após a atualização
      document.getElementById('machine-form').reset();
      document.getElementById('machine-id').value = ''; 
  
      // Recarregar a página ou atualizar a lista de máquinas (implementar de acordo com sua necessidade)
      location.reload(); 
    })
    .catch(error => {
      console.error('Erro ao atualizar máquina:', error);
      alert(error.message); 
    });
  }
  
  // Adicionar um event listener para o envio do formulário de inclusão de máquinas
  document.getElementById('machine-form').addEventListener('submit', function(event) {
    event.preventDefault(); 
  
    const machineId = document.getElementById('machine-id').value; 
  
    if (machineId) {
      // Editar máquina existente
      updateMachine(document.getElementById('machine-cod').value); 
    } else {
      // Criar nova máquina (implemente a lógica aqui)
      alert('Máquina não existe. Por favor, selecione uma máquina para editar.');   
    }
  });
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
  // Direcionar para lista de manutenção
  window.maintenanceMachine = function(machineId) {
    // Redirecionar para a página maintenance.html com o machineId como parâmetro na URL
    window.location.href = `maintenance.html?machineId=${machineId}`; 
  };
  
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
  // Função para limpar o formulário de máquinas
function clearMachineForm() {
  const machineForm = document.getElementById('machine-form');
  machineForm.reset();
  document.getElementById('machine-id').value = ''; 
  // machineForm.style.display = 'none'; // Opcional: ocultar o formulário
}

// Adicionar um event listener ao botão "Cancelar"
document.getElementById('cancel-machine-btn').addEventListener('click', clearMachineForm);

  // Função para mostrar mensagens de feedback
  function showMessage(message) {
      messageContainer.textContent = message;
      messageContainer.style.display = 'block';
      setTimeout(() => {
          messageContainer.style.display = 'none';
      }, 3000); // Oculta a mensagem após 3 segundos
  }
});
window.maintenanceMachine = function(id_machine) {
  // Redirecionar para a página maintenance.html com o id da máquina
  window.location.href = `maintenance.html?machineId=${id_machine}`;
};
document.addEventListener('DOMContentLoaded', function() {
  const maintenanceTable = document.getElementById('maintenance-table').getElementsByTagName('tbody')[0];
  const createMaintenanceBtn = document.getElementById('create-maintenance-btn');

  // Obter o machineId da URL
  const urlParams = new URLSearchParams(window.location.search);
  const machineId = urlParams.get('machineId');

  // Buscar as manutenções da máquina
  fetch(`http://localhost:3000/machines/${machineId}/maintenances`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao buscar manutenções. Código HTTP: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Exibir os dados das manutenções na tabela
      displayMaintenances(data);

      // Verificar o nível de acesso do usuário 
      const userAccessLevel = getUserAccessLevel(); 

      if (userAccessLevel >= 1) {
        createMaintenanceBtn.style.display = 'block'; 
      } else {
        createMaintenanceBtn.style.display = 'none'; 
      }

      // Ocultar o indicador de carregamento
      hideLoadingIndicator(); 
    })
    .catch(error => {
      console.error('Erro ao buscar manutenções:', error);
      alert('Ocorreu um erro ao buscar as manutenções da máquina.');

      // Ocultar o indicador de carregamento em caso de erro
      hideLoadingIndicator(); 
    });
});

// Funções auxiliares para exibir/ocultar o indicador de carregamento 
function showLoadingIndicator() {
  // Exemplo simples usando um elemento com a classe 'loader'
  const loader = document.querySelector('.loader'); 
  if (loader) {
    loader.style.display = 'block';
  }
}

function hideLoadingIndicator() {
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// Função para exibir as manutenções na tabela
function displayMaintenances(maintenances) {
  const maintenanceTable = document.getElementById('maintenance-table').getElementsByTagName('tbody')[0];
  maintenanceTable.innerHTML = ''; // Limpar a tabela antes de adicionar novas linhas

  maintenances.forEach(maintenance => {
    const row = maintenanceTable.insertRow();
    row.insertCell(0).textContent = formatDate(maintenance.date); 
    row.insertCell(1).textContent = maintenance.id;
    row.insertCell(2).textContent = maintenance.summary || '-'; // Lidar com campo possivelmente nulo
    row.insertCell(3).textContent = maintenance.solution || '-'; // Lidar com campo possivelmente nulo
    row.insertCell(4).textContent = maintenance.endDate ? formatDate(maintenance.endDate) : '-'; // Lidar com campo possivelmente nulo
    row.insertCell(5).textContent = getMaintenanceStatusText(maintenance.status); 

    // Adicionar botões de editar/excluir 
    const actionsCell = row.insertCell(6);
    actionsCell.innerHTML = `
      <button onclick="editMaintenance(${maintenance.id})">Editar</button>
      <button onclick="deleteMaintenance(${maintenance.id})">Excluir</button>
    `;
  });
}

// Função para formatar a data (implemente de acordo com o formato desejado)
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0'); 
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const year = date.getFullYear();   

  return `${day}/${month}/${year}`;   

}

// Função para obter o texto do status da manutenção
function getMaintenanceStatusText(status) {
  const statusMap = {
    1: 'Inicial',
    2: 'Aguardando peça',
    3: 'Aguardando técnico',
    4: 'Resolvido/Solucionado'
  };
  return statusMap[status] || 'Desconhecido';
}

function editMaintenance(id) {
  // Exibir um indicador de carregamento (opcional)
  showLoadingIndicator();

  // Buscar os dados da manutenção pelo ID
  fetch(`http://localhost:3000/maintenances/${id}`) // Substitua pela sua rota real para buscar manutenções por ID
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao buscar manutenção. Código HTTP: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Preencher o formulário de inclusão de manutenções (assumindo que você tem um formulário com IDs correspondentes)
      document.getElementById('maintenance-id').value = data.id; // Campo oculto para o ID da manutenção
      document.getElementById('maintenance-date').value = data.date; // Assumindo que você tem um campo para a data
      document.getElementById('maintenance-summary').value = data.summary; // Assumindo que você tem um campo para o resumo/descrição
      document.getElementById('maintenance-solution').value = data.solution; // Assumindo que você tem um campo para a solução/laudo
      document.getElementById('maintenance-end-date').value = data.endDate; // Assumindo que você tem um campo para a data final
      document.getElementById('maintenance-status').value = data.status; // Assumindo que você tem um campo para o status

      // Opcional: exibir o formulário de inclusão de manutenções se ele estiver oculto
      document.getElementById('maintenance-form').style.display = 'block'; // Assumindo que você tem um formulário com o ID 'maintenance-form'

      // Ocultar o indicador de carregamento
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error('Erro ao buscar manutenção:', error);
      alert(error.message);

      // Ocultar o indicador de carregamento em caso de erro
      hideLoadingIndicator();
    });
}
//função de deletar manutenção
function deleteMaintenance(id) {
  if (confirm('Tem certeza que deseja excluir esta manutenção?')) { // Confirmação antes de excluir

    // Exibir o indicador de carregamento (opcional)
    showLoadingIndicator();

    fetch(`http://localhost:3000/maintenances/${id}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao excluir manutenção. Código HTTP: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log(data.message); // Exibir a mensagem de sucesso do servidor
      // Atualizar a lista de manutenções na tabela
      fetchMachines(); // Ou use outra lógica para atualizar a lista

      // Ocultar o indicador de carregamento
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error('Erro ao excluir manutenção:', error);
      alert('Ocorreu um erro ao excluir a manutenção.');

      // Ocultar o indicador de carregamento em caso de erro
      hideLoadingIndicator();
    });
  }
}
createMaintenanceBtn.addEventListener('click', () => {
  formContainer.style.display = 'block'; // Exibir o formulário
  createMaintenanceBtn.style.display = 'none'; // Esconder o botão "Criar Manutenção"
});
  // Quando clicar no botão "Cancelar"
  cancelMaintenanceBtn.addEventListener('click', () => {
    formContainer.style.display = 'none'; // Esconder o formulário
    createMaintenanceBtn.style.display = 'block'; // Mostrar novamente o botão "Criar Manutenção"
});
// Função para obter o nível de acesso do usuário (implementar de acordo com a sua lógica de autenticação)
function getUserAccessLevel() {
  const userData = JSON.parse(localStorage.getItem('userData')); // Ou sessionStorage
  return userData ? userData.accessLevel : 0; // Retorna 0 se o usuário não estiver logado
}