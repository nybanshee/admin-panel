local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

--------------------------------------------------------------------------------
-- [CONFIGURATION]
-------------------------------------------------------------------------------- CONFIGURATION
-- 1. URL: Use your Render Backend URL
local API_URL = "https://admin-panel-2o96.onrender.com/api/roblox" 

-- 2. API Key: Must match ROBLOX_API_KEY in server.js / render.yaml
local API_KEY = "change_me_in_prod" 

-- 3. Polling Interval: How often to check for updates (seconds)
local SYNC_INTERVAL = 5 
--------------------------------------------------------------------------------

-- Initialize Storage
local ConfigValue = ReplicatedStorage:FindFirstChild("GameConfigJSON")
if not ConfigValue then
	ConfigValue = Instance.new("StringValue")
	ConfigValue.Name = "GameConfigJSON"
	ConfigValue.Parent = ReplicatedStorage
end

local function syncConfig()
	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = API_URL .. "/config",
			Method = "GET",
			Headers = {
				["Roblox-Security-Key"] = API_KEY
			}
		})
	end)

	if success and response.Success then
		-- 1. Decode to verify validity
		local data = HttpService:JSONDecode(response.Body)
		
		-- 2. Update the JSON StringValue (Clients/Server Scripts can read this)
		if ConfigValue.Value ~= response.Body then
			ConfigValue.Value = response.Body
			print("✅ [AdminPanel] Game Config Updated!")
			
			-- 3. (Optional) Fire a BindableEvent if you have a reload system
			-- game.ServerStorage.ConfigUpdated:Fire(data)
		end
	else
		warn("⚠️ [AdminPanel] Sync Failed:", response)
	end
end

-- --- LOGGING SYSTEM ---
local function sendLog(level, message, details, source)
	task.spawn(function()
		pcall(function()
			HttpService:RequestAsync({
				Url = API_URL .. "/logs",
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
					["Roblox-Security-Key"] = API_KEY
				},
				Body = HttpService:JSONEncode({
					level = level,
					message = message,
					source = source or "GameServer",
					details = details
				})
			})
		end)
	end)
end

-- --- MAIN LOOPS ---

-- 1. Config Sync Loop
task.spawn(function()
	while true do
		syncConfig()
		task.wait(SYNC_INTERVAL)
	end
end)

-- 2. Player Logging
Players.PlayerAdded:Connect(function(player)
	sendLog("info", "Player Joined", {
		userId = player.UserId,
		name = player.Name
	}, "PlayerSystem")
end)

Players.PlayerRemoving:Connect(function(player)
	sendLog("info", "Player Left", {
		userId = player.UserId,
		name = player.Name
	}, "PlayerSystem")
end)

--------------------------------------------------------------------------------
-- [USAGE EXAMPLE]
-- To use this data in your gun scripts, use this ModuleScript pattern:
--------------------------------------------------------------------------------
--[[
	-- Create a ModuleScript named "GameConfig"
	local ReplicatedStorage = game:GetService("ReplicatedStorage")
	local HttpService = game:GetService("HttpService")
	
	local ConfigValue = ReplicatedStorage:WaitForChild("GameConfigJSON")
	local currentConfig = {}

	if ConfigValue.Value ~= "" then
		currentConfig = HttpService:JSONDecode(ConfigValue.Value)
	end

	ConfigValue.Changed:Connect(function(val)
		currentConfig = HttpService:JSONDecode(val)
	end)

	local module = {}
	
	function module.GetGunStats(gunId)
		if currentConfig.guns and currentConfig.guns[gunId] then
			return currentConfig.guns[gunId].stats
		end
		return nil
	end
	
	function module.GetAll()
		return currentConfig
	end
	
	return module
]]
