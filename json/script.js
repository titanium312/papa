    // Función para cambiar el estilo de la página
    function cambiarEstilo(tipo) {
      const estiloMujeres = document.getElementById('estiloMujeres');
      const estiloHombres = document.getElementById('estiloHombres');

      if (tipo === 'mujeres') {
        // Activar estilo de mujeres y desactivar el de hombres
        estiloMujeres.disabled = false;
        estiloHombres.disabled = true;
      } else if (tipo === 'hombres') {
        // Activar estilo de hombres y desactivar el de mujeres
        estiloMujeres.disabled = true;
        estiloHombres.disabled = false;
      }
    }

    // Función para mostrar los equipos según el tipo (mujeres o hombres)
    async function mostrarEquipos(tipo) {
      // Cambiar el estilo
      cambiarEstilo(tipo);

      // Cambiar el título de la categoría
      document.getElementById("categoriaTitulo").textContent = tipo === 'mujeres' ? 'Equipos Femeninos' : 'Equipos Masculinos';

      const tablaBody = document.querySelector('#tablaEquipos tbody');
      tablaBody.innerHTML = ''; // Limpiar la tabla antes de cargar nuevos datos

      try {
        const respuesta = await fetch(`http://localhost:3000/equipos/${tipo}`);
        const equipos = await respuesta.json();

        if (equipos.length === 0) {
          tablaBody.innerHTML = '<tr><td colspan="10">No se encontraron equipos para esta categoría.</td></tr>';
          return;
        }

        equipos.forEach((equipo, index) => {
          const fila = document.createElement('tr');

          const celdaPosicion = document.createElement('td');
          celdaPosicion.textContent = index + 1;
          fila.appendChild(celdaPosicion);

          const celdaEquipo = document.createElement('td');
          celdaEquipo.classList.add('equipo');
          celdaEquipo.innerHTML = `<img src="http://localhost:3000/${equipo.escudo}" alt="${equipo.nombre}"> ${equipo.nombre}`;
          fila.appendChild(celdaEquipo);

          const celdas = ['ganados', 'empatados', 'perdidos', 'golesAFavor', 'golesEnContra'];
          celdas.forEach(celda => {
            const td = document.createElement('td');
            td.classList.add('editable');
            td.contentEditable = true;
            td.textContent = equipo[celda];
            td.addEventListener('input', actualizarDatos);
            fila.appendChild(td);
          });

          const celdaDiferenciaGoles = document.createElement('td');
          celdaDiferenciaGoles.textContent = equipo.diferenciaGoles;
          fila.appendChild(celdaDiferenciaGoles);

          const celdaPuntos = document.createElement('td');
          celdaPuntos.textContent = equipo.puntos;
          fila.appendChild(celdaPuntos);

          const celdaAccion = document.createElement('td');
          const botonGuardar = document.createElement('button');
          botonGuardar.textContent = 'Guardar';
          botonGuardar.onclick = async () => {
            botonGuardar.disabled = true;
            await guardarCambios(equipo, tipo, fila);
            botonGuardar.disabled = false;
          };
          celdaAccion.appendChild(botonGuardar);
          fila.appendChild(celdaAccion);

          tablaBody.appendChild(fila);
        });
      } catch (error) {
        console.error('Error al cargar los equipos:', error);
        tablaBody.innerHTML = '<tr><td colspan="10">No se pudieron cargar los equipos. Intenta nuevamente.</td></tr>';
      }
    }

    // Función para actualizar los puntos y la diferencia de goles
    function actualizarDatos() {
      const celdas = this.closest('tr').querySelectorAll('td.editable');
      const golesAFavor = parseInt(celdas[3].textContent);
      const golesEnContra = parseInt(celdas[4].textContent);
      const diferenciaGoles = golesAFavor - golesEnContra;
      const celdaDiferenciaGoles = this.closest('tr').cells[6];
      celdaDiferenciaGoles.textContent = diferenciaGoles;

      const puntos = calcularPuntos(
        parseInt(celdas[0].textContent),
        parseInt(celdas[1].textContent),
        parseInt(celdas[2].textContent)
      );
      const celdaPuntos = this.closest('tr').cells[7];
      celdaPuntos.textContent = puntos;
    }

    // Función para calcular los puntos
    function calcularPuntos(ganados, empatados, perdidos) {
      return ganados * 3 + empatados; // 3 puntos por victoria, 1 por empate
    }

    // Función para guardar los cambios de un equipo
    async function guardarCambios(equipo, tipo, fila) {
      const celdas = fila.querySelectorAll('td.editable');
      const nuevoEquipo = {
        nombre: equipo.nombre,
        tipo: tipo,
        ganados: parseInt(celdas[0].textContent),
        empatados: parseInt(celdas[1].textContent),
        perdidos: parseInt(celdas[2].textContent),
        golesAFavor: parseInt(celdas[3].textContent),
        golesEnContra: parseInt(celdas[4].textContent),
        diferenciaGoles: parseInt(celdas[3].textContent) - parseInt(celdas[4].textContent),
        puntos: calcularPuntos(parseInt(celdas[0].textContent), parseInt(celdas[1].textContent), parseInt(celdas[2].textContent))
      };

      try {
        const respuesta = await fetch(`http://localhost:3000/equipos/${tipo}/${equipo.nombre}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoEquipo)
        });

        const datos = await respuesta.json();
        if (datos.mensaje) {
          alert('Equipo actualizado correctamente');
          mostrarEquipos(tipo); // Recargar la tabla con los nuevos datos
        } else {
          alert('Error al actualizar el equipo');
        }
      } catch (error) {
        console.error('Error al guardar los cambios:', error);
      }
    }

    // Mostrar los equipos femeninos al cargar la página
    window.onload = () => mostrarEquipos('mujeres');



    