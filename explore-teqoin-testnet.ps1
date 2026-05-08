[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [ValidateNotNullOrEmpty()]
  [string]$RpcUrl = 'https://rpc.teqoin.io',

  [Parameter(Mandatory = $false)]
  [ValidateNotNullOrEmpty()]
  [string]$WsUrl = 'wss://ws.teqoin.io',

  [Parameter(Mandatory = $false)]
  [ValidateNotNullOrEmpty()]
  [string]$ExplorerUrl = 'https://testnet-blockscan.teqoin.io',

  [Parameter(Mandatory = $false)]
  [ValidateNotNullOrEmpty()]
  [string]$FaucetUrl = 'https://faucet.teqoin.io',

  [Parameter(Mandatory = $false)]
  [ValidatePattern('^0x[a-fA-F0-9]{40}$')]
  [string]$Address,

  [Parameter(Mandatory = $false)]
  [ValidateSet('compile', 'all', 'deploy', 'tx-smoke', 'full')]
  [string]$Dev = 'compile'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
$projectDir = Join-Path $repoRoot 'dev\hardhat'
$envFile = Join-Path $projectDir '.env'

function Write-Section([string]$Title) {
  Write-Host ''
  Write-Host ('=' * 80)
  Write-Host $Title
  Write-Host ('=' * 80)
}

function Invoke-JsonRpc {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $false)][object[]]$Params = @(),
    [Parameter(Mandatory = $false)][int]$Id = 1
  )

  $payload = [ordered]@{
    jsonrpc = '2.0'
    id      = $Id
    method  = $Method
    params  = $Params
  } | ConvertTo-Json -Depth 8

  $response = Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Body $payload
  $hasError = $response.PSObject.Properties.Name -contains 'error'
  if ($hasError -and $null -ne $response.error) {
    throw "JSON-RPC error calling ${Method}: $($response.error.message)"
  }

  return $response.result
}

function Invoke-Hardhat {
  param(
    [Parameter(Mandatory = $true)][string[]]$HardhatArgs
  )

  Push-Location $projectDir
  try {
    & npx --no-install hardhat @HardhatArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Hardhat command failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)][string]$Key
  )

  if (-not (Test-Path -LiteralPath $envFile)) {
    return $null
  }

  foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match ('^' + [regex]::Escape($Key) + '=(.*)$')) {
      return $Matches[1].Trim()
    }
  }

  return $null
}

function Require-EnvValue {
  param(
    [Parameter(Mandatory = $true)][string]$Key,
    [Parameter(Mandatory = $true)][string]$FriendlyName
  )

  $value = Get-EnvValue -Key $Key
  if (-not $value -or $value -match '^<.*>$') {
    throw "$FriendlyName is required in dev/hardhat/.env ($Key)"
  }

  return $value
}

function Test-RpcConnectivity {
  Write-Section 'RPC Connectivity Checks'
  try {
    $chainIdHex = Invoke-JsonRpc -Url $RpcUrl -Method 'eth_chainId'
    $netVersion = Invoke-JsonRpc -Url $RpcUrl -Method 'net_version'
    $latestBlockHex = Invoke-JsonRpc -Url $RpcUrl -Method 'eth_blockNumber'
    $gasPriceHex = Invoke-JsonRpc -Url $RpcUrl -Method 'eth_gasPrice'
    $latestBlock = Invoke-JsonRpc -Url $RpcUrl -Method 'eth_getBlockByNumber' -Params @($latestBlockHex, $false)

    [pscustomobject]@{
      RpcUrl      = $RpcUrl
      ChainIdHex  = $chainIdHex
      ChainIdDec  = [Convert]::ToInt64($chainIdHex, 16)
      NetVersion  = $netVersion
      BlockHex    = $latestBlockHex
      BlockDec    = [Convert]::ToInt64($latestBlockHex, 16)
      GasPriceHex = $gasPriceHex
    } | Format-List | Out-Host

    Write-Host ''
    Write-Host 'Latest block (overview):'
    Write-Host ''
    [pscustomobject]@{
      LatestBlockHash = $latestBlock.hash
      ParentHash      = $latestBlock.parentHash
      TimestampHex    = $latestBlock.timestamp
      TimestampUnix   = [Convert]::ToInt64($latestBlock.timestamp, 16)
      TxCount         = $latestBlock.transactions.Count
    } | Format-List | Out-Host
  }
  catch {
    Write-Warning "RPC connectivity check failed: $($_.Exception.Message)"
  }
}

function Show-QuickLinks {
  Write-Section 'TeQoin Testnet - Quick Links'
  Write-Host "RPC (HTTP):     $RpcUrl"
  Write-Host "RPC (WS):       $WsUrl"
  Write-Host "Explorer:       $ExplorerUrl"
  Write-Host "Faucet:         $FaucetUrl"
  Write-Host 'Send mode:      wallet A ↔ wallet B native ETH transfers'
}

function Show-UserChecklist {
  Write-Section 'User Exploration Checklist'
  Write-Host '1) Add network to wallet (MetaMask/Telegram Wallet)'
  Write-Host "2) Request testnet ETH from faucet: $FaucetUrl"
  Write-Host "3) Send a small tx then verify in explorer: $ExplorerUrl"
  Write-Host '4) Optional: use send loop to move ETH between wallet A and wallet B'
}

function Show-EnvGuidance {
  Write-Section 'Env Check'
  if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Warning 'dev/hardhat/.env not found!'
    Write-Host 'Copy dev/hardhat/.env.example to dev/hardhat/.env and fill the required values.'
    return
  }

  Write-Host 'Required for send loop:'
  Write-Host "- PRIVATE_KEY: $(if (Get-EnvValue -Key 'PRIVATE_KEY') { 'configured' } else { 'missing' })"
  Write-Host "- WALLET_B_ADDRESS: $(if (Get-EnvValue -Key 'WALLET_B_ADDRESS') { 'configured' } else { 'missing' })"
  Write-Host "- SECOND_PRIVATE_KEY: $(if (Get-EnvValue -Key 'SECOND_PRIVATE_KEY') { 'configured' } else { 'missing' })"
  Write-Host "- SEND_AMOUNT_ETH: $(if (Get-EnvValue -Key 'SEND_AMOUNT_ETH') { 'configured' } else { 'missing' })"
  Write-Host "- SEND_ITERATIONS: $(if (Get-EnvValue -Key 'SEND_ITERATIONS') { 'configured' } else { 'missing' })"
}

function Invoke-Compile {
  Write-Section 'Hardhat Compile'
  Invoke-Hardhat -HardhatArgs @('compile')
}

function Invoke-SendSingle {
  Write-Section 'Send: Wallet A → Wallet B'
  Write-Host 'Sending native ETH from wallet A to wallet B...'
  Invoke-Hardhat -HardhatArgs @('run', 'scripts/bridge.js', '--network', 'teqoinTestnet')
}

function Invoke-SendLoop {
  Write-Section 'Send-All: Wallet A ↔ Wallet B Loop'
  Write-Host 'Executing alternating wallet-to-wallet sends...'
  Invoke-Hardhat -HardhatArgs @('run', 'scripts/multi-bridge.js', '--network', 'teqoinTestnet')
}

function Invoke-Deploy {
  Write-Section 'Deploy: Counter Contract to TeQoin Testnet'
  Write-Host 'Running deployment script...'
  Invoke-Hardhat -HardhatArgs @('run', 'scripts/deploy.js', '--network', 'teqoinTestnet')
}

function Invoke-TxSmoke {
  Write-Section 'Developer Tx Smoke Test (Counter)'
  Write-Host 'Running recommended dev transactions...'
  Invoke-Hardhat -HardhatArgs @('run', 'scripts/tx-smoke.js', '--network', 'teqoinTestnet')
}

Show-QuickLinks
Test-RpcConnectivity
Show-UserChecklist
Show-EnvGuidance

switch ($Dev) {
  'compile' {
    Invoke-Compile
  }
  'all' {
    Require-EnvValue -Key 'PRIVATE_KEY' -FriendlyName 'PRIVATE_KEY' | Out-Null
    Require-EnvValue -Key 'SECOND_PRIVATE_KEY' -FriendlyName 'SECOND_PRIVATE_KEY' | Out-Null
    Require-EnvValue -Key 'WALLET_B_ADDRESS' -FriendlyName 'WALLET_B_ADDRESS' | Out-Null
    Invoke-SendLoop
  }
  'deploy' {
    Require-EnvValue -Key 'PRIVATE_KEY' -FriendlyName 'PRIVATE_KEY' | Out-Null
    Invoke-Deploy
  }
  'tx-smoke' {
    Require-EnvValue -Key 'PRIVATE_KEY' -FriendlyName 'PRIVATE_KEY' | Out-Null
    Invoke-TxSmoke
  }
  'full' {
    Require-EnvValue -Key 'PRIVATE_KEY' -FriendlyName 'PRIVATE_KEY' | Out-Null
    Require-EnvValue -Key 'SECOND_PRIVATE_KEY' -FriendlyName 'SECOND_PRIVATE_KEY' | Out-Null
    Require-EnvValue -Key 'WALLET_B_ADDRESS' -FriendlyName 'WALLET_B_ADDRESS' | Out-Null

    Invoke-Compile
    Invoke-SendLoop
    Invoke-Deploy
    Invoke-TxSmoke
  }
}

Write-Section 'Done'
Write-Host 'Execution finished.'
Write-Host "Explorer: $ExplorerUrl"
