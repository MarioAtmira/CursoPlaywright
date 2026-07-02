// Centralised repository of elements and supporting texts for the project.
// All selectors, routes, and expected values are kept here to avoid
// duplication across Page Objects and test specs.
export const elementRepository = {
  // *****************************
  // *         CONTAINERS        *
  // *****************************
  containers: {
    // Main header container used to locate navigation links.
    headerTestId: 'header-container',
  },

  // *****************************
  // *           LINKS           *
  // *****************************
  links: {
    // Top navigation link to the Courses section.
    courses: {
      name: 'Cursos',
      exact: true,
    },
    // Top navigation link to the Resources section.
    resources: {
      name: 'Recursos',
      exact: true,
    },
    // Link that opens the Automation Sandbox in a new tab.
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
    // Relative routes combined with the Playwright baseURL.
    home: '/',
    courses: '/cursos',
    resources: '/recursos',
  },

  // *****************************
  // *          TITLES           *
  // *****************************
  titles: {
    // Expected titles used to assert that navigation reached the correct page.
    home: 'Free Range Testers',
    courses: 'Cursos',
  },

  // *****************************
  // *          BUTTONS          *
  // *****************************
  buttons: {
    // Sandbox button that generates a dynamic ID and reveals a hidden message.
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
    // Element that appears after clicking the sandbox button.
    generatedMessage: '#hidden-element',
  },

  texts: {
    // Partial text used to assert the hidden message has appeared.
    generatedMessagePartial: 'aparezco después de 3 segundos',
    aBoringText: 'Un aburrido texto',
    // Fill value for the sandbox text input.
    testInputValue: 'Texto de prueba',
  },

  // *****************************
  // *        CHECKBOXES         *
  // *****************************
  checkboxes: {
    // Sandbox checkbox that can be checked and unchecked.
    pizzaCheckbox: { 
      role: 'checkbox', 
      name: 'Pizza 🍕' 
    }
  },

  // *****************************
  // *       RADIO BUTTONS       *
  // *****************************
  radioButtons: {
    // Sandbox radio button that can be selected.
    radioButtonSi: { 
      role: 'radio', 
      name: 'Si' 
    }
  },
} as const;
