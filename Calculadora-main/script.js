class SistemaNotas {
    constructor() {
        this.estudiantes = [];
        this.porcentajes = {
            corte1: 30,
            corte2: 30,
            corte3: 40
        };
        this.notaMinima = 3.0;
        this.filtro = '';

        // Cache DOM elements
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.formPorcentajes = document.getElementById('form-porcentajes');
        this.btnAgregarEstudiante = document.getElementById('btn-agregar-estudiante');
        this.searchInput = document.getElementById('search-estudiantes');
        this.inputNotaMinima = document.getElementById('nota-minima'); // Capturamos el nuevo input
        this.formEstudiante = document.getElementById('form-estudiante');
        this.btnCancelar = document.getElementById('btn-cancelar');
        this.modalEstudiante = document.getElementById('modal-estudiante');
        this.modalTitle = document.getElementById('modal-title');
        this.estudiantesBody = document.getElementById('estudiantes-body');
        this.toast = document.getElementById('toast');
        
        this.init();
    }

    init() {
        this.cargarDatos();
        this.renderizarEstudiantes();
        this.configurarEventListeners();
    }

    cargarDatos() {
        const data = localStorage.getItem('sistemaNotas');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.estudiantes = parsed.estudiantes || [];
                this.porcentajes = parsed.porcentajes || this.porcentajes;
                this.notaMinima = parsed.notaMinima || 3.0; // Cargamos la nota mínima guardada
                
                // Actualizamos el valor en el input de la pantalla
                if (this.inputNotaMinima) this.inputNotaMinima.value = this.notaMinima;
            } catch (e) {
                console.error('Error al cargar datos:', e);
            }
        }
    }

    guardarDatos() {
        try {
            localStorage.setItem('sistemaNotas', JSON.stringify({
                estudiantes: this.estudiantes,
                porcentajes: this.porcentajes,
                notaMinima: this.notaMinima // Guardamos la nota mínima también
            }));
        } catch (e) {
            console.error('Error al guardar datos:', e);
        }
    }

    configurarEventListeners() {
        // Escuchar cambios en la Nota Mínima (Esto hace que el 4 funcione)
        if (this.inputNotaMinima) {
            this.inputNotaMinima.addEventListener('input', (e) => {
                this.notaMinima = parseFloat(e.target.value) || 0;
                this.renderizarEstudiantes(); // Re-renderiza al instante
                this.guardarDatos();
            });
        }

        this.navLinks.forEach(link => link.addEventListener('click', (e) => {
            e.preventDefault();
            this.mostrarSeccion(e.target.dataset.section);
        }));

        this.formPorcentajes.addEventListener('submit', (e) => {
            e.preventDefault();
            ['corte1', 'corte2', 'corte3'].forEach(corte => {
                this.porcentajes[corte] = parseInt(document.getElementById(corte).value);
            });
            this.guardarDatos();
            this.renderizarEstudiantes(); // Actualizar tabla con nuevos porcentajes
            this.mostrarToast('Configuración guardada', 'success');
        });

        this.btnAgregarEstudiante.addEventListener('click', () => this.mostrarModalEstudiante());
        
        this.searchInput.addEventListener('input', (e) => {
            this.filtro = e.target.value.trim().toLowerCase();
            this.renderizarEstudiantes();
        });

        this.formEstudiante.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarEstudiante();
        });

        this.btnCancelar.addEventListener('click', () => this.ocultarModal());
    }

    renderizarEstudiantes() {
        if (!this.estudiantesBody) return;
        this.estudiantesBody.innerHTML = '';

        const estudiantesFiltrados = this.estudiantes.filter(estudiante => 
            !this.filtro || 
            estudiante.nombre.toLowerCase().includes(this.filtro) ||
            estudiante.codigo.toLowerCase().includes(this.filtro)
        );

        const p1 = this.porcentajes.corte1 / 100;
        const p2 = this.porcentajes.corte2 / 100;
        const p3 = this.porcentajes.corte3 / 100;

        estudiantesFiltrados.forEach((estudiante, index) => {
            const tr = document.createElement('tr');
            
            // Notas (si son null, usamos 0 para el cálculo)
            const n1 = estudiante.corte1 || 0;
            const n2 = estudiante.corte2 || 0;
            const n3 = estudiante.corte3 || 0;

            const definitiva = (n1 * p1) + (n2 * p2) + (n3 * p3);
            const acumuladoActual = (n1 * p1) + (n2 * p2);
            
            // Cálculo dinámico de lo que falta para llegar a la notaMinima (ej: 4.0)
            const falta = (this.notaMinima - acumuladoActual) / p3;

            let mensaje = '';
            let color = '';

            // Lógica corregida: Si ya tiene la nota con los 3 cortes o con solo 2
            if ((acumuladoActual + (n3 * p3)) >= this.notaMinima) {
                mensaje = '¡APROBADO! 🎉';
                color = '#4CAF50';
            } else if (falta > 5.0) {
                mensaje = 'INALCANZABLE ❌';
                color = '#f44336';
            } else {
                mensaje = `Falta: ${falta.toFixed(2)} en C3`;
                color = '#ff9800';
            }

            tr.innerHTML = `
                <td>${estudiante.codigo}</td>
                <td>${estudiante.nombre}</td>
                <td>${estudiante.corte1 ?? 'N/A'}</td>
                <td>${estudiante.corte2 ?? 'N/A'}</td>
                <td>${estudiante.corte3 ?? 'N/A'}</td>
                <td><strong>${definitiva.toFixed(2)}</strong></td>
                <td style="color: ${color}; font-weight: bold;">${mensaje}</td>
                <td class="acciones">
                    <button class="btn" onclick="sistema.editarEstudiante('${estudiante.id}')">Editar</button>
                    <button class="btn" onclick="sistema.eliminarEstudiante('${estudiante.id}')">Eliminar</button>
                </td>
            `;
            this.estudiantesBody.appendChild(tr);
        });
    }

    // ... (Mantén tus métodos de mostrarModal, guardarEstudiante, editar, eliminar, etc.)
    mostrarToast(mensaje, tipo) {
        this.toast.textContent = mensaje;
        this.toast.className = `toast ${tipo}`;
        this.toast.style.display = 'block';
        setTimeout(() => this.toast.style.display = 'none', 3000);
    }

    mostrarSeccion(seccion) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
        document.getElementById(seccion)?.classList.add('active');
        document.querySelector(`[data-section="${seccion}"]`)?.classList.add('active');
    }

    mostrarModalEstudiante(estudiante = null) {
        this.modalTitle.textContent = estudiante ? 'Editar Estudiante' : 'Agregar Estudiante';
        this.formEstudiante.reset();
        document.getElementById('estudiante-id').value = estudiante ? estudiante.id : '';
        if (estudiante) {
            document.getElementById('estudiante-nombre').value = estudiante.nombre;
            document.getElementById('estudiante-codigo').value = estudiante.codigo;
            document.getElementById('estudiante-corte1').value = estudiante.corte1;
            document.getElementById('estudiante-corte2').value = estudiante.corte2;
            document.getElementById('estudiante-corte3').value = estudiante.corte3;
        }
        this.modalEstudiante.style.display = 'flex';
    }

    ocultarModal() { this.modalEstudiante.style.display = 'none'; }

    guardarEstudiante() {
        const id = document.getElementById('estudiante-id').value || Date.now().toString();
        const estudiante = {
            id,
            nombre: document.getElementById('estudiante-nombre').value,
            codigo: document.getElementById('estudiante-codigo').value,
            corte1: parseFloat(document.getElementById('estudiante-corte1').value) || null,
            corte2: parseFloat(document.getElementById('estudiante-corte2').value) || null,
            corte3: parseFloat(document.getElementById('estudiante-corte3').value) || null
        };

        const index = this.estudiantes.findIndex(e => e.id === id);
        if (index >= 0) this.estudiantes[index] = estudiante;
        else this.estudiantes.push(estudiante);

        this.guardarDatos();
        this.renderizarEstudiantes();
        this.ocultarModal();
    }

    editarEstudiante(id) {
        const est = this.estudiantes.find(e => e.id === id);
        this.mostrarModalEstudiante(est);
    }

    eliminarEstudiante(id) {
        this.estudiantes = this.estudiantes.filter(e => e.id !== id);
        this.guardarDatos();
        this.renderizarEstudiantes();
    }
}

// Inicialización global
let sistema;
document.addEventListener('DOMContentLoaded', () => {
    sistema = new SistemaNotas();
});