pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/tandintashigyeltshen15/tandintashigyeltshen_02250373_DSO101_A2.git'
            }
        }
        stage('Install') {
            steps {
                dir('backend') {
                    bat 'npm install'
                }
            }
        }
        stage('Test') {
            steps {
                dir('backend') {
                    bat 'npm test'
                }
            }
            post {
                always {
                    junit 'backend/junit.xml'
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                dir('backend') {
                    bat 'docker build -t tandintashigyeltshen/todo-backend-02250373:latest .'
                }
            }
        }
        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-creds') {
                        docker.image('tandintashigyeltshen/todo-backend-02250373:latest').push()
                    }
                }
            }
        }
    }
}