// Repositorio centralizado de elementos y textos de apoyo del proyecto.
// La idea es concentrar aqui selectores, rutas y valores esperados para
// evitar duplicados dentro de los Page Objects o de los tests.
export const elementRepository = {
  // *****************************
  // *         CONTAINERS        *
  // *****************************
  containers: {
    // Contenedor del header principal usado para localizar enlaces del menu.
    headerTestId: 'header-container',
  },

  // *****************************
  // *           LINKS           *
  // *****************************
  links: {
    // Enlace del menu superior hacia la seccion de cursos.
    courses: {
      name: 'Cursos',
      exact: true,
    },
    // Enlace del menu superior hacia la seccion de recursos.
    resources: {
      name: 'Recursos',
      exact: true,
    },
    // Enlace que abre el sandbox de automatizacion en una ventana nueva.
    automationSandbox: {
      role: 'link',
      name: 'Automation Sandbox',
      exact: true,
    },
  },

  // *****************************
  // *          ROUTES           *
  // *****************************
  routes: {
    // Rutas relativas que se combinan con la baseURL de Playwright.
    home: '/',
    courses: '/cursos',
    resources: '/recursos',
  },

  // *****************************
  // *          TITLES           *
  // *****************************
  titles: {
    // Titulos esperados para validar que la navegacion ha llegado a la pagina correcta.
    home: 'Free Range Testers',
    courses: 'Cursos',
  },

  // *****************************
  // *          BUTTONS          *
  // *****************************
  buttons: {
    // Boton del sandbox que genera un ID dinamico y muestra un mensaje oculto.
    generateId: {
      role: 'button',
      name: 'Hacé click para generar un ID dinámico y mostrar el elemento oculto',
      exact: true,
    },
  },


  // *****************************
  // *       TEXT ELEMENTS       *
  // *****************************
  hiddenElements: {
    // Elemento que aparece tras pulsar el boton del sandbox.
    generatedMessage: '#hidden-element',
  },

  texts: {
    // Fragmento del texto esperado para validar que el mensaje oculto ha aparecido.
    generatedMessagePartial: 'aparezco después de 3 segundos',
    aBoringText: 'Un aburrido texto',
    // Valor de relleno para el campo de texto del sandbox.
    testInputValue: 'Texto de prueba',
  },

  // *****************************
  // *        CHECKBOXES         *
  // *****************************
  checkboxes: {
    // Checkbox del sandbox que se puede marcar y desmarcar.
    pizzaCheckbox: { 
      role: 'checkbox', 
      name: 'Pizza 🍕' 
    }
  },

  // *****************************
  // *       RADIO BUTTONS       *
  // *****************************
  radioButtons: {
    // Radio button del sandbox que se puede seleccionar.
    radioButtonSi: { 
      role: 'radio', 
      name: 'Si' 
    }
  },
} as const;
