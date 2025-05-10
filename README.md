# Microgram - Interactive Telegram Bot Builder Platform

Microgram is a microservice-based application that allows users to create, configure, and deploy Telegram bots through an interactive web interface. The platform enables users to define bot commands, create conversation flows, and deploy bots without writing any code.

## Architecture Overview

The application is built using a microservice architecture with the following components:

1. **React Frontend**: Modern UI built with React for an interactive user experience
2. **API Gateway Service**: Entry point for all client requests, routes to appropriate microservices
3. **User Service**: Handles user authentication, registration, and profile management
4. **Bot Builder Service**: Core service for creating and configuring bots
5. **Bot Runtime Service**: Executes bot logic and interacts with Telegram API
6. **Database Service**: Handles data persistence for all services

## Service Communication

Services communicate with each other through HTTP REST APIs. In a production environment, a message queue system like RabbitMQ could be used for asynchronous communication.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- yarn
- MongoDB (optional, for production use)
- React (v18 or higher, included in dependencies)
- Docker and Docker Compose (for Docker deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/microgram.git
   cd microgram
   ```

2. Install backend dependencies:
   ```
   yarn install
   ```

3. Install React client dependencies:
   ```
   yarn client-install
   ```

4. Start all services in development mode:
   ```
   yarn run dev
   ```

5. To run both backend and frontend concurrently:
   ```
   yarn dev-full
   ```

### Starting Individual Services

You can start each service individually using the following commands:

- API Gateway: `yarn gateway`
- User Service: `yarn user-service`
- Bot Builder Service: `yarn bot-builder`
- Bot Runtime Service: `yarn run bot-runtime`
- Database Service: `yarn db-service`
- React Client (Development): `yarn client`
- Build React Client: `yarn client-build`

You can also run the backend and React client concurrently in development mode:

```
yarn dev-full
```

## Features

### React Frontend
- Modern, responsive UI built with React
- Component-based architecture for maintainability
- React Router for client-side routing
- React Bootstrap for consistent styling
- Authentication state management with Context API

### User Management
- User registration and authentication
- Profile management
- Bot ownership and access control

### Bot Builder
- Create new bots with custom names
- Define commands with descriptions and responses
- Create interactive conversation flows
- Deploy bots to the Telegram platform

### Bot Runtime
- Execute bot logic based on user interactions
- Handle commands and conversation flows
- Track bot usage and analytics

## API Documentation

### API Gateway Endpoints
- `/api/users/*`: Routes to User Service
- `/api/bot-builder/*`: Routes to Bot Builder Service
- `/api/bot-runtime/*`: Routes to Bot Runtime Service

### User Service Endpoints
- `POST /register`: Register a new user
- `POST /login`: Authenticate a user
- `GET /profile/:userId`: Get user profile
- `GET /:userId/bots`: Get user's bots

### Bot Builder Endpoints
- `POST /`: Create a new bot
- `GET /user/:userId`: Get all bots for a user
- `GET /:botId`: Get a specific bot
- `PUT /:botId`: Update a bot
- `POST /:botId/commands`: Add a command to a bot
- `POST /:botId/flows`: Add a flow to a bot
- `POST /:botId/deploy`: Deploy a bot

### Bot Runtime Endpoints
- `POST /deploy`: Deploy a bot
- `POST /undeploy/:botId`: Undeploy a bot
- `GET /deployed`: Get all deployed bots
- `POST /simulate/:botId/command`: Simulate a command (for testing)
- `POST /simulate/:botId/flow`: Simulate a flow (for testing)

### Database Service Endpoints
- CRUD operations for users, bots, runtime data, and analytics

## Development

This project uses a microservice architecture to allow for independent development and scaling of each component. Each service can be developed, tested, and deployed separately.

### Docker Deployment

The application can be deployed using Docker and Docker Compose, which simplifies the setup process and ensures consistent environments.

#### Prerequisites for Docker Deployment

- Docker
- Docker Compose

#### Running with Docker Compose

1. Build and start all services:
   ```
   docker-compose up -d
   ```

2. To rebuild services after making changes:
   ```
   docker-compose up -d --build
   ```

3. To stop all services:
   ```
   docker-compose down
   ```

4. To view logs:
   ```
   docker-compose logs -f
   ```

5. To view logs for a specific service:
   ```
   docker-compose logs -f <service-name>
   ```

The application will be available at:
- Frontend: http://localhost
- API Gateway: http://localhost:3333
- MongoDB: mongodb://localhost:27017/microgram

### React Client Development

The React client is located in the `client` directory and follows standard React application structure:

- `src/components`: Reusable UI components
- `src/pages`: Page components for different routes
- `src/services`: Service modules including authentication

#### Client Assets

To start the React development server with hot reloading:

```
yarn client
```

To build the React application for production:

```
yarn client-build
```

The production build will be created in the `client/build` directory and served by the main Express server in production mode.

## Development vs Docker Environment

The application can be run in two different environments:

1. **Local Development Environment** (`yarn dev-full`):
   - Uses the React development server for the client
   - API requests are proxied to the API Gateway
   - MongoDB should be running locally or accessible via localhost

2. **Docker Environment** (`docker-compose up`):
   - Uses Nginx to serve the client
   - API requests are handled by Nginx and forwarded to the API Gateway
   - MongoDB runs in a Docker container

To ensure both environments work correctly:

1. Create a `.env` file based on `.env.example` if it doesn't exist
2. Make sure MongoDB is running and accessible (either locally or via Docker)
3. If using Docker, make sure Docker and Docker Compose are installed and running

## MongoDB Configuration and Troubleshooting

The application uses MongoDB for data storage. The MongoDB connection is configured in the DB Service.

### MongoDB Connection Configuration

The MongoDB connection is configured in the `.env` file:

```
MONGO_URI=mongodb://localhost:27017/microgram
```

For Docker deployment, the MongoDB URI should be:

```
MONGO_URI=mongodb://mongodb:27017/microgram
```

### MongoDB Connection Troubleshooting

If you encounter MongoDB connection issues, try the following:

1. **Check if MongoDB is running**:
   - For local development: `mongod --version` to check if MongoDB is installed, and `ps aux | grep mongod` to check if it's running
   - For Docker: `docker ps | grep mongodb` to check if the MongoDB container is running

2. **Check MongoDB connection**:
   - For local development: `mongo mongodb://localhost:27017/microgram` to connect to MongoDB directly
   - For Docker: `docker exec -it microgram-mongodb mongo` to connect to MongoDB inside the container

3. **Check MongoDB logs**:
   - For local development: Check MongoDB logs in the system log directory
   - For Docker: `docker logs microgram-mongodb` to check MongoDB container logs

4. **Increase connection timeouts**:
   - The DB Service is configured with increased timeouts to handle temporary connection issues
   - If you still encounter timeouts, you may need to increase the timeouts further in the DB Service code

5. **Restart the services**:
   - For local development: Restart the DB Service with `yarn db-service`
   - For Docker: Restart the containers with `docker-compose restart`


## License

MIT
