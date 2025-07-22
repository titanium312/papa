








const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');  // <--- aquí
const app = express();
const port = 3000;


app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir CSS estático
app.use('/json/cs', express.static(path.join(__dirname, 'json', 'cs')));

// Servir imágenes
app.use('/ImgMujer', express.static(path.join(__dirname, 'ImgMujer')));
app.use('/ImgHombre', express.static(path.join(__dirname, 'ImgHombre')));

// Servir todos los archivos estáticos en PUBLIC (index.html, goles.html, etc.)
app.use(express.static(path.join(__dirname, 'PUBLIC')));

// Opcional: para raíz servir index.html explícitamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'PUBLIC/index.html'));
});




app.get('/listado-imagenes/:genero', (req, res) => {
  const genero = req.params.genero; // 'ImgHombre' o 'ImgMujer'
  if (genero !== 'ImgHombre' && genero !== 'ImgMujer') {
    return res.status(400).json({ error: 'Género no válido' });
  }

  const dirPath = path.join(__dirname, genero);

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo leer el directorio' });
    }
    // Filtrar solo archivos de imagen (opcional)
    const images = files.filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));
    res.json({ imagenes: images });
  });
});


const golesPath = path.join(__dirname, 'json', 'goles.json');

// ✅ Mostrar todos los goleadores (hombres y mujeres)
app.get('/goleadores', (req, res) => {
  fs.readFile(golesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer goles.json' });

    try {
      const goles = JSON.parse(data);
      res.json(goles);
    } catch (error) {
      res.status(500).json({ error: 'Error al parsear goles.json' });
    }
  });
});


app.put('/goleadores/:genero', (req, res) => {
  const genero = req.params.genero.toLowerCase(); // "hombres" o "mujeres"
  const nuevoJugador = req.body;

  if (!nuevoJugador.jugador || !nuevoJugador.equipo || typeof nuevoJugador.goles !== 'number' || !nuevoJugador.escudo) {
    return res.status(400).json({ error: 'Datos incompletos o incorrectos. Se requiere escudo.' });
  }

  fs.readFile(golesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer goles.json' });

    let goles = JSON.parse(data);
    let lista = genero === 'hombres' ? goles.goleadoresHombres : goles.goleadorasMujeres;

    const index = lista.findIndex(j => j.jugador.toLowerCase() === nuevoJugador.jugador.toLowerCase());

    if (index !== -1) {
      lista[index] = { ...lista[index], ...nuevoJugador };
    } else {
      lista.push(nuevoJugador);
    }

    lista.sort((a, b) => b.goles - a.goles);
    lista.forEach((j, i) => j.posicion = i + 1);

    fs.writeFile(golesPath, JSON.stringify(goles, null, 2), 'utf8', err => {
      if (err) return res.status(500).json({ error: 'No se pudo guardar goles.json' });

      res.json({ mensaje: 'Jugador agregado o actualizado', datos: lista });
    });
  });
});


app.delete('/goleadores/:genero/:nombre', (req, res) => {
  const { genero, nombre } = req.params;

  fs.readFile(golesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'No se pudo leer goles.json' });

    let goles = JSON.parse(data);
    let lista = genero === 'hombres' ? goles.goleadoresHombres : goles.goleadorasMujeres;

    const index = lista.findIndex(j => j.jugador.toLowerCase() === nombre.toLowerCase());
    if (index === -1) return res.status(404).json({ error: 'Jugador no encontrado' });

    lista.splice(index, 1);

    lista.sort((a, b) => b.goles - a.goles);
    lista.forEach((j, i) => j.posicion = i + 1);

    fs.writeFile(golesPath, JSON.stringify(goles, null, 2), 'utf8', err => {
      if (err) return res.status(500).json({ error: 'No se pudo guardar goles.json' });

      res.json({ mensaje: 'Jugador eliminado', datos: lista });
    });
  });
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
