import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // React App Generator
  plop.setGenerator("react-app", {
    description: "Create a new React application",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the new app?",
        validate: (input: string) => {
          if (input.includes(".")) {
            return "App name cannot include an extension";
          }
          if (input.includes(" ")) {
            return "App name cannot include spaces";
          }
          if (!input) {
            return "App name is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the new app?",
        default: "A new React application",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "apps/{{ kebabCase name }}",
        base: "templates/react-app",
        templateFiles: "templates/react-app/**/*",
      },
    ],
  });

  // React Package Generator
  plop.setGenerator("react-package", {
    description: "Create a new React package",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the new package?",
        validate: (input: string) => {
          if (input.includes(".")) {
            return "Package name cannot include an extension";
          }
          if (input.includes(" ")) {
            return "Package name cannot include spaces";
          }
          if (!input) {
            return "Package name is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the new package?",
        default: "A new React package",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "packages/{{ kebabCase name }}",
        base: "templates/react-package",
        templateFiles: "templates/react-package/**/*",
      },
    ],
  });

  // Python API Generator
  plop.setGenerator("python-api", {
    description: "Create a new Python FastAPI application",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the new API?",
        validate: (input: string) => {
          if (input.includes(".")) {
            return "API name cannot include an extension";
          }
          if (input.includes(" ")) {
            return "API name cannot include spaces";
          }
          if (!input) {
            return "API name is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the new API?",
        default: "A new FastAPI application",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "apps/{{ kebabCase name }}",
        base: "templates/python-api",
        templateFiles: "templates/python-api/**/*",
      },
    ],
  });

  // Python Package Generator
  plop.setGenerator("python-package", {
    description: "Create a new Python package",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the new package?",
        validate: (input: string) => {
          if (input.includes(".")) {
            return "Package name cannot include an extension";
          }
          if (input.includes(" ")) {
            return "Package name cannot include spaces";
          }
          if (!input) {
            return "Package name is required";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of the new package?",
        default: "A new Python package",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "packages/{{ kebabCase name }}",
        base: "templates/python-package",
        templateFiles: "templates/python-package/**/*",
      },
    ],
  });
}
