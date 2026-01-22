pipeline {
    agent any

    tools {
        maven 'mvn-3.9.6'
        nodejs 'v10.15.3'
    }

    parameters {
        choice(name: 'edition', choices: ['freshly', 'official'], description: 'Build edition')
    }

    stages {
        stage('Checkout & Setup') {
            steps {
                // 1. Clone the main project to 'iceblue_rem' logic directory
                // We use 'iceblue_rem' because releaseToFileServer.sh constructs path as "${PROJECT}/target/..."
                dir('iceblue_rem') {
                    git branch: 'iceblue_rem', 
                        url: 'git@github.com:zkoss/zkThemeTemplate.git'
                }
                
                // 2. Clone release-helper as a SIBLING to 'iceblue_rem'
                dir('release-helper') {
                    git branch: 'main', 
                        credentialsId: 'gitlab-zkoss', 
                        url: 'git@gitlab.potix.com:zk-support/release-helper.git'
                }
            }
        }

        stage('Build') {
            steps {
                // Run build INSIDE the project directory
                dir('iceblue_rem') {
                    // Call the mavenBuild script from the sibling directory with the edition parameter
                    sh "../release-helper/mavenBuild.sh -e ${params.edition}"
                }
                
                // Prepare version.properties for the next step
                // releaseToFileServer.sh expects version.properties in the current directory (workspace root)
                sh 'cp iceblue_rem/version.properties .'
            }
        }
        
        stage('Release') {
             steps {
                 // Run release script from workspace root
                 // It will look for artifacts in ./iceblue_rem/target/...
                 sh './release-helper/releaseToFileServer.sh -p iceblue_rem'
             }
        }
    }
}
