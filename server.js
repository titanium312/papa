const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');
const app = express();
const port = 3000;

// Habilitar CORS para permitir solicitudes desde cualquier origen
app.use(cors({ origin: '*' }));
app.use(express.json()); // Permite recibir datos JSON

// Servir archivos CSS estáticos desde la carpeta json/cs
app.use('/json/cs', express.static(path.join(__dirname, 'json', 'cs')));


// Servir imágenes de los escudos desde las carpetas ImgMujer e ImgHombre
app.use('/ImgMujer', express.static(path.join(__dirname, 'ImgMujer')));
app.use('/ImgHombre', express.static(path.join(__dirname, 'ImgHombre')));

// Ruta para servir el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html.html'));
});

// Ruta para servir el archivo JS ofuscado
app.get('/script.js', (req, res) => {
  fs.readFile(path.join(__dirname, 'script.js'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error leyendo el archivo JS');
    }

    // Ofuscar el código JS
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(data, {
      compact: true,
      controlFlowFlattening: true,
      stringArray: true,
      renameGlobals: true,
      deadCodeInjection: true
    }).getObfuscatedCode();

    res.type('application/javascript');  // Asegúrate de que se sirva como JS
    res.send(obfuscatedCode);  // Enviar el código ofuscado
  });
});

// Ruta para cargar los equipos (hombres o mujeres)
app.get('/equipos/:tipo', (req, res) => {
  const tipo = req.params.tipo;

  // Asegurarse de que el tipo sea válido (hombres o mujeres)
  if (tipo !== 'hombres' && tipo !== 'mujeres') {
    return res.status(400).json({ error: 'Tipo de equipo no válido. Usa "hombres" o "mujeres".' });
  }

  // Leer los datos desde el archivo correspondiente (equipos-hombres.json o equipos-mujeres.json)
  fs.readFile(path.join(__dirname, 'json', `equipos-${tipo}.json`), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cargar los equipos' });
    }
    res.json(JSON.parse(data));
  });
});

// Ruta para actualizar los puntajes de un equipo
app.put('/equipos/:tipo/:nombre', (req, res) => {
  const tipo = req.params.tipo;
  const nombreEquipo = req.params.nombre;
  const nuevoEquipo = req.body;

  // Asegurarse de que el tipo sea válido (hombres o mujeres)
  if (tipo !== 'hombres' && tipo !== 'mujeres') {
    return res.status(400).json({ error: 'Tipo de equipo no válido. Usa "hombres" o "mujeres".' });
  }

  // Leer los datos de los equipos
  fs.readFile(path.join(__dirname, 'json', `equipos-${tipo}.json`), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cargar los equipos' });
    }

    const equipos = JSON.parse(data);
    const equipoIndex = equipos.findIndex((e) => e.nombre === nombreEquipo);

    if (equipoIndex === -1) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Actualizar los datos del equipo
    equipos[equipoIndex] = { ...equipos[equipoIndex], ...nuevoEquipo };

    // Guardar los equipos actualizados en el archivo
    fs.writeFile(path.join(__dirname, 'json', `equipos-${tipo}.json`), JSON.stringify(equipos, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al guardar los cambios' });
      }
      res.json({ mensaje: 'Equipo actualizado correctamente' });
    });
  });
});

// Iniciar el servidor en el puerto 3000
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
