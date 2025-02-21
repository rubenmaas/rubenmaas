#!/bin/bash

# Smart deployment script with rollback
deploy_service() {
    local service=$1
    local version=$2
    local env=$3
    
    echo "🚀 Deploying $service version $version to $env"
    
    # Save current state for rollback
    kubectl get deployment $service -o yaml > rollback_$service.yaml
    
    # Canary deployment
    kubectl set image deployment/$service \
        $service=$REGISTRY/$service:$version --record
    
    # Monitor deployment health
    if ! monitor_deployment_health $service; then
        echo "❌ Deployment health check failed! Rolling back..."
        kubectl rollout undo deployment/$service
        return 1
    fi
    
    echo "✅ Deployment successful!"
    return 0
}

monitor_deployment_health() {
    local service=$1
    local timeout=300
    local interval=10
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if kubectl rollout status deployment/$service --timeout=10s; then
            if check_service_health $service; then
                return 0
            fi
        fi
        elapsed=$((elapsed + interval))
        sleep $interval
    done
    
    return 1
}

# Usage
deploy_service "travel-api" "v2.3.0" "production" 