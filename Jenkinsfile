// Builds the Marble theme jar, stages it on the release file server and,
// when 'publish' is ticked, triggers PBFUM to push it to the ZK CE Maven repo
// (https://mavensync.zkoss.org/maven2/org/zkoss/theme/marble/).
//
// Version: mavenBuild.sh takes <version> from pom.xml (11.0.0) and, for the
// 'freshly' edition, appends .FL.yyyymmdd  ->  11.0.0.FL.20261001
pipeline {
    agent any

    tools {
        jdk 'OpenJDK 17'
        maven 'mvn-3.9.6'
        nodejs 'LatestLTS'
    }

    parameters {
        choice(name: 'edition', choices: ['freshly', 'official'], description: 'Build edition: freshly = 11.0.0.FL.yyyymmdd, official = 11.0.0')
        booleanParam(name: 'publish', defaultValue: false, description: 'Also trigger PBFUM to publish to the CE Maven repo. Maven releases are immutable - leave unticked for a trial run.')
    }

    stages {
        stage('Checkout') {
            steps {
                // releaseToFileServer.sh resolves "${PROJECT}/target/..." from the workspace root,
                // so the project must live in a directory named after the artifactId.
                dir('marble') {
                    git branch: 'marble',
                        url: 'git@github.com:zkoss/zkThemeTemplate.git'
                }
                // release-helper must be a sibling of the project directory
                dir('release-helper') {
                    git branch: 'main',
                        credentialsId: 'gitlab-zkoss',
                        url: 'git@gitlab.potix.com:zk-support/release-helper.git'
                }
            }
        }

        stage('Build') {
            steps {
                dir('marble') {
                    sh 'npm ci'
                    // skip.watch.css: the async dev-mode watcher would overwrite the minified CSS before packaging
                    sh '../release-helper/mavenBuild.sh -e ${edition} -Dskip.watch.css=true'
                }
                // releaseToFileServer.sh reads version.properties from the workspace root
                sh 'cp marble/version.properties .'
            }
        }

        stage('Stage on file server') {
            steps {
                sh './release-helper/releaseToFileServer.sh -p marble'
            }
        }

        stage('Publish to CE Maven') {
            when { expression { params.publish } }
            steps {
                script {
                    def project = sh(script: "sed -n 's/^project=//p' version.properties", returnStdout: true).trim()
                    def version = sh(script: "sed -n 's/^version=//p' version.properties", returnStdout: true).trim()
                    build job: 'PBFUM', wait: true, parameters: [
                        string(name: 'project', value: project),
                        string(name: 'version', value: version),
                        string(name: 'maven', value: 'ce')
                    ]
                }
            }
        }
    }
}
