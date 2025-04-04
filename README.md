# Workflow Management System

## 🚀 Overview

A powerful, intuitive workflow management application built with React that allows users to create, edit, execute, and monitor custom workflows. Create visual flowcharts connecting various action steps including API calls and email notifications with an elegant drag-and-drop interface.

## ✨ Features

### Authentication
- Secure user login with email and password
- Session management

### Workflow Dashboard
- Comprehensive list view of all workflows
- Status indicators (passed/failed) for quick assessment
- Powerful search functionality by name or workflow ID
- One-click workflow execution with confirmation
- Easy access to edit existing workflows

### Visual Workflow Builder
- Intuitive flowchart-based workflow creation
- Logical sequence connection between steps
- Interactive canvas with zoom and pan capabilities
- Real-time workflow visualization
- Autosave and manual save options

## 🛠️ Tech Stack

- **Frontend**: React.js
- **State Management**: Zustand
- **Workflow Visualization**: React Flow
- **Data Storage**: Firebase
- **Styling**: CSS/SCSS with responsive design
- **Deployment**: Vercel

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/vaibhxv/workflow-manager.git

# Navigate to project directory
cd workflow-manager

# Install dependencies
npm install

# Start development server
npm start
```

## 🖥️ Usage

### Creating a Workflow

1. Log in to your account
2. Navigate to the Workflow List and click "Create New Workflow"
3. Add a starting point to your workflow
4. Drag and drop action nodes onto the canvas
5. Connect nodes to establish the workflow sequence
6. Configure each node with necessary parameters
7. Save your workflow

### Executing a Workflow

1. From the Workflow List, find your workflow
2. Click the "Execute" button
3. Confirm execution in the modal prompt
4. View real-time execution results

### Example Workflow

Create a workflow that:
1. Makes an API call to fetch data
2. Processes the response
3. Sends the processed data via email

## 📊 Demo

Visit our [live demo](workflow-manager-inky.vercel.app) to try the system.

## 🔄 Development Process

This application was developed as part of a Front-End Software Engineer assessment with a focus on:
- Clean, maintainable React code structure
- Intuitive UI/UX implementation
- Effective data management
- Responsive design principles
