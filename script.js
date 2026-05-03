
class SistemaNotas {
    constructor() {
        this.estudiantes = [];
        this.porcentajes = {
            corte1: 30,
            corte2: 30,
            corte3: 40
        };
        this.filtro = '';
        // Cache DOM elements
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.formPorcentajes = document.getElementById('form-porcentajes');
        this.btnAgregarEstudiante = document.getElementById('btn-agregar-estudiante');
        this.searchInput = document.getElementById('search-estudiantes');
        this.formEstudiante = document.getElementById('form-estudiante');
        this.btnCancelar = document.getElementById('btn-cancelar');
        this.modalEstudiante = document.getElementById('modal-estudiante');
        this.modalTitle = document.getElementById('modal-title');
        this.estudiantesGrid = document.getElementById('estudiantes-grid');
        this.toast = document.getElementById('toast');
        this.init();
    }

    init() {
        this.cargarDatos();
        this.configurarEventListeners();
    }

    cargarDatos() {
        const data = localStorage.getItem('sistemaNotas');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.estudiantes = parsed.estudiantes || [];
                this.porcentajes = parsed.porcentajes || this.porcentajes;
            } catch (e) {
                console.error('Error al cargar datos:', e);
            }
        }
    }

    guardarDatos() {
        try {
            localStorage.setItem('sistemaNotas', JSON.stringify({
                estudiantes: this.estudiantes,
                porcentajes: this.porcentajes
            }));
        } catch (e) {
            console.error('Error al guardar datos:', e);
        }
    }

    configurarEventListeners() {
        // Navegación entre secciones
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.mostrarSeccion(section);
            });
        });

        // Formulario de porcentajes
        this.formPorcentajes.addEventListener('submit', (e) => {
            e.preventDefault();
            this.porcentajes.corte1 = parseInt(document.getElementById('corte1').value);
            this.porcentajes.corte2 = parseInt(document.getElementById('corte2').value);
            this.porcentajes.corte3 = parseInt(document.getElementById('corte3').value);
            this.guardarDatos();
            this.mostrarToast('Porcentajes guardados', 'success');
        });

        // Agregar estudiante
        this.btnAgregarEstudiante.addEventListener('click', () => {
            this.mostrarModalEstudiante();
        });

        // Buscador de estudiantes
        this.searchInput.addEventListener('input', (e) => {
            this.filtro = e.target.value.trim().toLowerCase();
            this.renderizarEstudiantes();
        });

        // Formulario de estudiante
        this.formEstudiante.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarEstudiante();
        });

        this.btnCancelar.addEventListener('click', () => {
            this.ocultarModal();
        });
    }

    calcularDefinitiva(estudiante) {
        let definitiva = 0;
        let completados = 0;
        if (estudiante.corte1 !== null) {
            definitiva += estudiante.corte1 * (this.porcentajes.corte1 / 100);
            completados++;
        }
        if (estudiante.corte2 !== null) {
            definitiva += estudiante.corte2 * (this.porcentajes.corte2 / 100);
            completados++;
        }
        if (estudiante.corte3 !== null) {
            definitiva += estudiante.corte3 * (this.porcentajes.corte3 / 100);
            completados++;
        }
        return { definitiva: Math.round(definitiva * 100) / 100, completados };
    }

    calcularNotaNecesaria(estudiante, objetivoNota) {
        const { definitiva: acumulado, completados } = this.calcularDefinitiva(estudiante);
        if (completados === 3) return null;
        const faltantes = [];
        if (estudiante.corte1 === null) faltantes.push('corte1');
        if (estudiante.corte2 === null) faltantes.push('corte2');
        if (estudiante.corte3 === null) faltantes.push('corte3');
        if (faltantes.length === 0) return null;
        const porcentajeRestante = this.porcentajes[faltantes[faltantes.length - 1]] / 100;
        const restante = (objetivoNota - acumulado) / porcentajeRestante;
        if (restante < 0 || restante > 5.0) return null;
        return Math.round(restante * 100) / 100;
    }

    validarNota(valor) {
        const num = parseFloat(valor);
        if (isNaN(num) || num < 0 || num > 5.0) return null;
        return Math.round(num * 100) / 100;
    }

    validarDatosEstudiante(nombre, codigo, id) {
        if (!nombre || nombre.trim().length < 2) return false;
        if (!codigo || codigo.trim().length < 1) return false;
        if (this.estudiantes.some(e => e.id !== id && e.codigo === codigo)) return false;
        return true;
    }

    renderizarEstudiantes() {
        this.estudiantesGrid.innerHTML = '';

        const estudiantesFiltrados = this.estudiantes.filter(estudiante => {
            if (!this.filtro) return true;
            return estudiante.nombre.toLowerCase().includes(this.filtro)
                || estudiante.codigo.toLowerCase().includes(this.filtro);
        });

        if (estudiantesFiltrados.length === 0) {
            this.estudiantesGrid.innerHTML = '<p class="sin-resultados">No se encontraron estudiantes con la búsqueda.</p>';
            return;
        }

        estudiantesFiltrados.forEach(estudiante => {
            const { definitiva, completados } = this.calcularDefinitiva(estudiante);
            const estado = definitiva >= 3 ? 'success' : definitiva >= 2 ? 'warning' : 'danger';

            const card = document.createElement('div');
            card.className = 'estudiante-card';
            card.style.borderLeftColor = `var(--color-${estado})`;

            const header = document.createElement('div');
            header.className = 'card-header';

            const nombre = document.createElement('h3');
            nombre.textContent = estudiante.nombre;
            header.appendChild(nombre);

            const codigo = document.createElement('span');
            codigo.className = 'codigo';
            codigo.textContent = estudiante.codigo;
            header.appendChild(codigo);

            card.appendChild(header);

            const notasGrid = document.createElement('div');
            notasGrid.className = 'notas-grid';

            const pCorte1 = document.createElement('p');
            pCorte1.innerHTML = '<strong>Corte 1</strong><br>' + (estudiante.corte1 || 'N/A');
            notasGrid.appendChild(pCorte1);

            const pCorte2 = document.createElement('p');
            pCorte2.innerHTML = '<strong>Corte 2</strong><br>' + (estudiante.corte2 || 'N/A');
            notasGrid.appendChild(pCorte2);

            const pCorte3 = document.createElement('p');
            pCorte3.innerHTML = '<strong>Corte 3</strong><br>' + (estudiante.corte3 || 'N/A');
            notasGrid.appendChild(pCorte3);

            const pDefinitiva = document.createElement('p');
            pDefinitiva.innerHTML = '<strong>Definitiva</strong><br>' + `${definitiva} (${completados}/3)`;
            notasGrid.appendChild(pDefinitiva);

            card.appendChild(notasGrid);

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn';
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', () => this.editarEstudiante(estudiante.id));
            actions.appendChild(btnEditar);

            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn';
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.addEventListener('click', () => this.eliminarEstudiante(estudiante.id));
            actions.appendChild(btnEliminar);

            const btnCalcular = document.createElement('button');
            btnCalcular.className = 'btn';
            btnCalcular.textContent = 'Calcular Nota Necesaria';
            btnCalcular.addEventListener('click', () => this.calcularNotaNecesariaPrompt(estudiante.id));
            actions.appendChild(btnCalcular);

            card.appendChild(actions);
            this.estudiantesGrid.appendChild(card);
        });
    }

    mostrarToast(mensaje, tipo) {
        this.toast.textContent = mensaje;
        this.toast.className = `toast ${tipo}`;
        this.toast.style.display = 'block';
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }

    mostrarSeccion(seccion) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
        document.getElementById(seccion).classList.add('active');
        document.querySelector(`[data-section="${seccion}"]`).classList.add('active');
    }

    mostrarModalEstudiante(estudiante = null) {
        const form = this.formEstudiante;

        if (estudiante) {
            this.modalTitle.textContent = 'Editar Estudiante';
            document.getElementById('estudiante-id').value = estudiante.id;
            document.getElementById('estudiante-nombre').value = estudiante.nombre;
            document.getElementById('estudiante-codigo').value = estudiante.codigo;
            document.getElementById('estudiante-corte1').value = estudiante.corte1 || '';
            document.getElementById('estudiante-corte2').value = estudiante.corte2 || '';
            document.getElementById('estudiante-corte3').value = estudiante.corte3 || '';
        } else {
            this.modalTitle.textContent = 'Agregar Estudiante';
            form.reset();
            document.getElementById('estudiante-id').value = '';
        }

        this.modalEstudiante.style.display = 'flex';
    }

    ocultarModal() {
        this.modalEstudiante.style.display = 'none';
    }

    guardarEstudiante() {
        const id = document.getElementById('estudiante-id').value || Date.now().toString();
        const nombre = document.getElementById('estudiante-nombre').value.trim();
        const codigo = document.getElementById('estudiante-codigo').value.trim();
        const corte1 = this.validarNota(document.getElementById('estudiante-corte1').value);
        const corte2 = this.validarNota(document.getElementById('estudiante-corte2').value);
        const corte3 = this.validarNota(document.getElementById('estudiante-corte3').value);

        if (!this.validarDatosEstudiante(nombre, codigo, id)) {
            this.mostrarToast('Datos inválidos o código duplicado', 'error');
            return;
        }

        const estudiante = { id, nombre, codigo, corte1, corte2, corte3 };
        const index = this.estudiantes.findIndex(e => e.id === id);
        if (index >= 0) {
            this.estudiantes[index] = estudiante;
        } else {
            this.estudiantes.push(estudiante);
        }

        this.guardarDatos();
        this.renderizarEstudiantes();
        this.ocultarModal();
        this.mostrarToast('Estudiante guardado', 'success');
    }

    editarEstudiante(id) {
        const estudiante = this.estudiantes.find(e => e.id === id);
        if (estudiante) {
            this.mostrarModalEstudiante(estudiante);
        }
    }

    eliminarEstudiante(id) {
        this.estudiantes = this.estudiantes.filter(e => e.id !== id);
        this.guardarDatos();
        this.renderizarEstudiantes();
        this.mostrarToast('Estudiante eliminado', 'warning');
    }

    calcularNotaNecesariaPrompt(id) {
        const estudiante = this.estudiantes.find(e => e.id === id);
        if (!estudiante) return;

        const objetivo = prompt('Ingrese la nota objetivo (0-5):');
        const objNum = parseFloat(objetivo);
        if (isNaN(objNum) || objNum < 0 || objNum > 5) {
            this.mostrarToast('Nota objetivo inválida', 'error');
            return;
        }

        const nota = this.calcularNotaNecesaria(estudiante, objNum);
        if (nota === null) {
            this.mostrarToast('No se puede calcular (ya completado o inalcanzable)', 'warning');
        } else {
            this.mostrarToast(`Nota necesaria: ${nota}`, 'info');
        }
    }
}

// Instanciar el sistema
const sistema = new SistemaNotas();

