model_provider = "OpenAI"
model = "gpt-5.6-sol"
review_model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
network_access = "enabled"
windows_wsl_setup_acknowledged = true
personality = "pragmatic"

[model_providers.OpenAI]
name = "OpenAI"
base_url = "https://share-ai.ckbdev.com"
wire_api = "responses"
requires_openai_auth = true

[features]
goals = true
multi_agent = true

[projects."/Users/oluwaseun/Desktop/fibertracebox"]
trust_level = "trusted"

[projects."/Users/oluwaseun/Desktop/project"]
trust_level = "trusted"

[projects."/Users/oluwaseun/Desktop/pactagent"]
trust_level = "trusted"

[projects."/Users/oluwaseun/Desktop/proofpay"]
trust_level = "trusted"

[projects."/Users/oluwaseun/Desktop/veyrivo"]
trust_level = "trusted"

mkdir -p .codex
nano  .codex/config.toml
