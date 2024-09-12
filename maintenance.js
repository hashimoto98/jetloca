document.addEventListener('DOMContentLoaded', function() {
  const maintenanceTable = document.getElementById('maintenance-table').getElementsByTagName('tbody')[0];
  const maintenanceForm = document.getElementById('maintenance-form');
  const createMaintenanceBtn = document.getElementById('create-maintenance-btn');

  // Obter o machineId da URL
  const urlParams = new URLSearchParams(window.location.search);
  const machineId = urlParams.get('machineId');
  
  function getUserAccessLevel() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return userData ? userData.accessLevel : 0; // Supondo que o nível de acesso do usuário esteja no localStorage
  }
  
  // Mostrar os botões de criação e edição de manutenção apenas se o nível de acesso for 1 ou 2
  const userAccessLevel = getUserAccessLevel();
  if (userAccessLevel === 1 || userAccessLevel === 2) {
    createMaintenanceBtn.style.display = 'block'; // Mostrar o botão de criar
  } else {
    createMaintenanceBtn.style.display = 'none'; // Esconder o botão de criar
  }
  
  // Adicionar botões de edição apenas para usuários de nível 1 ou 2
  function displayMaintenances(maintenances) {
    maintenanceTable.innerHTML = '';
  
    maintenances.forEach(maintenance => {
      const row = maintenanceTable.insertRow();
      row.insertCell(0).textContent = maintenance.contract;
      row.insertCell(1).textContent = maintenance.problem;
      row.insertCell(2).textContent = maintenance.solution || '-';
      row.insertCell(3).textContent = formatDateTime(maintenance.date);
      row.insertCell(4).textContent = maintenance.endDate ? formatDateTime(maintenance.endDate) : '-';
      row.insertCell(5).textContent = maintenance.partsUsed || '-';
  
      // Exibir botões de ação de acordo com o nível de acesso
      const actionsCell = row.insertCell(6);
      let actionsHtml = '';
      if (userAccessLevel === 1 || userAccessLevel === 2) {
        actionsHtml += `
          <button onclick="editMaintenance(${maintenance.id})">Editar</button>
          <button onclick="deleteMaintenance(${maintenance.id})">Excluir</button>
        `;
      }
      actionsCell.innerHTML = actionsHtml;
    });
  }
  
  // Buscar as manutenções da máquina
  fetchMaintenances(machineId);
  logoutBtn.addEventListener('click', function() {
    loginContainer.style.display = 'block';
    machineContainer.style.display = 'none';
});
  // Função para buscar as manutenções da máquina
  function fetchMaintenances(machineId) {
    showLoadingIndicator();

    fetch(`http://localhost:3000/machines/${machineId}/maintenances`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar manutenções. Código HTTP: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        displayMaintenances(data);
        const userAccessLevel = getUserAccessLevel();

        if (userAccessLevel >= 1) {
          createMaintenanceBtn.style.display = 'block';
        } else {
          createMaintenanceBtn.style.display = 'none';
        }

        hideLoadingIndicator();
      })
      .catch(error => {
        console.error('Erro ao buscar manutenções:', error);
        alert('Ocorreu um erro ao buscar as manutenções da máquina.');
        hideLoadingIndicator();
      });
  }

  // Função para exibir as manutenções na tabela
  function displayMaintenances(maintenances) {
    maintenanceTable.innerHTML = '';

    maintenances.forEach(maintenance => {
      const row = maintenanceTable.insertRow();
      row.insertCell(0).textContent = maintenance.contract;
      row.insertCell(1).textContent = maintenance.problem;
      row.insertCell(2).textContent = maintenance.solution || '-';
      row.insertCell(3).textContent = formatDateTime(maintenance.date);
      row.insertCell(4).textContent = maintenance.endDate ? formatDateTime(maintenance.endDate) : '-';
      row.insertCell(5).textContent = maintenance.partsUsed || '-';

      // Adicionar botões de editar/excluir
      const actionsCell = row.insertCell(6);
      let actionsHtml = '';
      if (getUserAccessLevel() >= 1) {
        actionsHtml += `
          <button onclick="editMaintenance(${maintenance.id})">Editar</button>
          <button onclick="deleteMaintenance(${maintenance.id})">Excluir</button>
        `;
      }
      actionsCell.innerHTML = actionsHtml;
    });
  }

  // Função para formatar data e hora
  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // Função para obter o nível de acesso do usuário
  function getUserAccessLevel() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return userData ? userData.accessLevel : 0;
  }

  // Funções para exibir e ocultar o indicador de carregamento
  function showLoadingIndicator() {
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

  // Função para editar uma manutenção existente
  function editMaintenance(id) {
    showLoadingIndicator();

    fetch(`http://localhost:3000/maintenances/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar manutenção. Código HTTP: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        document.getElementById('maintenance-id').value = data.id;
        document.getElementById('maintenance-machine-id').value = data.machine_id;
        document.getElementById('maintenance-contract').value = data.contract;
        document.getElementById('maintenance-problem').value = data.problem;
        document.getElementById('maintenance-solution').value = data.solution || '';
        document.getElementById('maintenance-start-date').value = data.date;
        document.getElementById('maintenance-end-date').value = data.endDate || '';
        document.getElementById('maintenance-parts-used').value = data.partsUsed || '';
        document.getElementById('maintenance-status').value = data.status;

        maintenanceForm.style.display = 'block';
        hideLoadingIndicator();
      })
      .catch(error => {
        console.error('Erro ao buscar manutenção:', error);
        alert(error.message);
        hideLoadingIndicator();
      });
  }

  // Função para excluir uma manutenção
  function deleteMaintenance(id) {
    if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
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
        console.log(data.message);
        fetchMaintenances(machineId);
        hideLoadingIndicator();
      })
      .catch(error => {
        console.error('Erro ao excluir manutenção:', error);
        alert('Ocorreu um erro ao excluir a manutenção.');
        hideLoadingIndicator();
      });
    }
  }

  // Manipulação do formulário de manutenção (para criar nova ou editar existente)
  maintenanceForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const maintenanceId = document.getElementById('maintenance-id').value;

    const contract = document.getElementById('maintenance-contract').value;
    const problem = document.getElementById('maintenance-problem').value;
    const solution = document.getElementById('maintenance-solution').value;
    const dateTime = document.getElementById('maintenance-start-date').value;
    const endDate = document.getElementById('maintenance-end-date').value;
    const partsUsed = document.getElementById('maintenance-parts-used').value;
    const status = document.getElementById('maintenance-status').value;

    const maintenanceData = {
      machine_id: machineId,
      contract,
      problem,
      solution,
      date: dateTime,
      endDate,
      partsUsed,
      status
    };

    const method = maintenanceId ? 'PUT' : 'POST';
    const url = maintenanceId
      ? `http://localhost:3000/maintenances/${maintenanceId}`
      : `http://localhost:3000/machines/${machineId}/maintenances`;

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(maintenanceData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao salvar manutenção. Código HTTP: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log(data.message);
      fetchMaintenances(machineId);

      maintenanceForm.reset();
      maintenanceForm.style.display = 'none';
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error('Erro ao salvar manutenção:', error);
      alert('Ocorreu um erro ao salvar a manutenção.');
      hideLoadingIndicator();
    });
  });

  // Função para cancelar o formulário de manutenção
  document.getElementById('cancel-maintenance-btn').addEventListener('click', function() {
    maintenanceForm.reset();
    maintenanceForm.style.display = 'none';
  });
});
