@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}


param scoultimateDiscordBotExists bool
@secure()
param scoultimateDiscordBotDefinition object

@description('Id of the user or app to assign application roles')
param principalId string

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location)

// Monitor application with Azure Monitor
module monitoring 'br/public:avm/ptn/azd/monitoring:0.1.0' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
    location: location
    tags: tags
  }
}

// Container registry
module containerRegistry 'br/public:avm/res/container-registry/registry:0.1.1' = {
  name: 'registry'
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    acrAdminUserEnabled: true
    tags: tags
    publicNetworkAccess: 'Enabled'
    roleAssignments:[
      {
        principalId: scoultimateDiscordBotIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
    ]
  }
}

// Container apps environment
module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.4.5' = {
  name: 'container-apps-environment'
  params: {
    logAnalyticsWorkspaceResourceId: monitoring.outputs.logAnalyticsWorkspaceResourceId
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    zoneRedundant: false
  }
}

module scoultimateDiscordBotIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'scoultimateDiscordBotidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}scoultimateDiscordBot-${resourceToken}'
    location: location
  }
}

module scoultimateDiscordBotFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'scoultimateDiscordBot-fetch-image'
  params: {
    exists: scoultimateDiscordBotExists
    name: 'scoultimate-discord-bot'
  }
}

var scoultimateDiscordBotAppSettingsArray = filter(array(scoultimateDiscordBotDefinition.settings), i => i.name != '')
var scoultimateDiscordBotSecrets = map(filter(scoultimateDiscordBotAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var scoultimateDiscordBotEnv = map(filter(scoultimateDiscordBotAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module scoultimateDiscordBot 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'scoultimateDiscordBot'
  params: {
    name: 'scoultimate-discord-bot'
    ingressTargetPort: 80
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    secrets: {
      secureList:  union([
      ],
      map(scoultimateDiscordBotSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: scoultimateDiscordBotFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: scoultimateDiscordBotIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '80'
          }
        ],
        scoultimateDiscordBotEnv,
        map(scoultimateDiscordBotSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [scoultimateDiscordBotIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: scoultimateDiscordBotIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'scoultimate-discord-bot' })
  }
}

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_RESOURCE_SCOULTIMATE_DISCORD_BOT_ID string = scoultimateDiscordBot.outputs.resourceId
