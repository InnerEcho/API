import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

interface SwaggerOptions {
  definition: {
    openapi: string;
    info: {
      title: string;
      description: string;
      contact: {
        name: string;
        email: string;
      };
      version: string;
    };
    servers: Array<{
      url: string;
      description: string;
    }>;
  };
  apis: string[];
}

const options: SwaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InnerEcho Api',
      description: 'InnerEcho Web App RESTful API Documentation',
      contact: {
        name: 'InnerEcho',
        email: 'dyddyd134@chungbuk.ac.kr',
        // url: "",
      },
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3001/',
        description: 'Local Development',
      },
      {
        url: 'http://test.co.kr/',
        description: 'Test Server',
      },
      {
        url: 'http://real.co.kr/',
        description: 'Real Server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './swagger/*'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
