import requests
import os

# Make sure to set the COHERE_API_KEY environment variable in a .env file (create if does not exist) - see .env.example

class Cohere:
    def generate_text(self, body):
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + os.getenv("COHERE_API_KEY")
        }
        # Text messages are stored inside request body using the Deep Chat JSON format:
        # https://deepchat.dev/docs/connect
        generation_body = {"prompt": body["messages"][0]["text"]}
        response = requests.post(
            "https://api.cohere.ai/v1/generate", json=generation_body, headers=headers)
        json_response = response.json()
        if "message" in json_response:
            raise Exception(json_response["message"])
        result = json_response["generations"][0]["text"]
        # Sends response back to Deep Chat using the Result format:
        # https://deepchat.dev/docs/connect/#Result
        return {"result": {"text": result}}
    
    def summarize_text(self, body):
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + os.getenv("COHERE_API_KEY")
        }
        # Text messages are stored inside request body using the Deep Chat JSON format:
        # https://deepchat.dev/docs/connect
        summarization_body = {"text": body["messages"][0]["text"]}
        response = requests.post(
            "https://api.cohere.ai/v1/summarize", json=summarization_body, headers=headers)
        json_response = response.json()
        if "message" in json_response:
            raise Exception(json_response["message"])
        result = json_response["summary"]
        # Sends response back to Deep Chat using the Result format:
        # https://deepchat.dev/docs/connect/#Result
        return {"result": {"text": result}}
