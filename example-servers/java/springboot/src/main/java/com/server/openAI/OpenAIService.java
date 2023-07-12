package com.server.openAI;

import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.bind.annotation.RequestPart;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.util.UriComponentsBuilder;
import com.server.utils.deepChat.DeepChatRequestMessage;
import org.springframework.web.multipart.MultipartFile;
import com.server.utils.deepChat.DeepChatFileResponse;
import org.springframework.core.io.buffer.DataBuffer;
import com.server.utils.deepChat.DeepChatRequestBody;
import com.server.utils.deepChat.DeepChatTextRespose;
import org.springframework.util.LinkedMultiValueMap;
import com.server.utils.deepChat.OpenAIChatMessage;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.server.utils.deepChat.OpenAIImageResult;
import com.server.utils.deepChat.OpenAIChatResult;
import com.server.utils.deepChat.OpenAIChatBody;
import com.server.utils.deepChat.DeepChatFile;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import java.nio.charset.StandardCharsets;
import com.server.utils.PrintObjectUtil;
import reactor.core.publisher.Flux;
import org.springframework.http.*;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import java.util.Arrays;
import org.slf4j.Logger;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {
  private static final Logger LOGGER = LoggerFactory.getLogger(OpenAIService.class);

  @Value("${OPENAI_API_KEY}")
  private String openAIAPIKey;
  
  public DeepChatTextRespose chat(DeepChatRequestBody requestBody) throws Exception {
    LOGGER.info("Received request body: {}", PrintObjectUtil.toJsonString(requestBody));
    OpenAIChatBody chatBody = OpenAIService.createOpenAIChatBody(requestBody, false);

    RestTemplate restTemplate = new RestTemplate();
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("Authorization", "Bearer " + openAIAPIKey);
    HttpEntity<OpenAIChatBody> requestEntity = new HttpEntity<>(chatBody, headers);
    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl("https://api.openai.com/v1/chat/completions");

    try {
      // send the request to openAI
      ResponseEntity<OpenAIChatResult> response = restTemplate.exchange(
        builder.toUriString(), HttpMethod.POST, requestEntity,OpenAIChatResult.class);

      if (response.getStatusCode() == HttpStatus.OK) {
        OpenAIChatResult responseBody = response.getBody();
        if (responseBody == null) throw new Exception("Unexpected response from OpenAI");
        // sends response back to Deep Chat using the Result format:
        // https://deepchat.dev/docs/connect/#Result
        return new DeepChatTextRespose(responseBody.getChoices()[0].getMessage().getContent());
      } else {
        throw new Exception(response.getStatusCode().toString());
      }
    } catch (Exception e) {
      LOGGER.error("Error when calling OpenAI API", e);
      throw new Exception(e);
    }
  }

  @SuppressWarnings("unchecked")
  public Flux<Object> chatStream(DeepChatRequestBody requestBody) {
    LOGGER.info("Received request body: {}", PrintObjectUtil.toJsonString(requestBody));
    OpenAIChatBody chatRequest = OpenAIService.createOpenAIChatBody(requestBody, true);
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.setBearerAuth(openAIAPIKey);
      WebClient client = WebClient.create("https://api.openai.com/v1");
      // send the request to openAI
      return client.post()
        .uri("/chat/completions")
        .headers(httpHeaders -> httpHeaders.addAll(headers))
        .bodyValue(chatRequest)
        .retrieve()
        .bodyToFlux(DataBuffer.class)
        .map(dataBuffer -> dataBuffer.toString(StandardCharsets.UTF_8))
        .concatMap(chunk -> {
          String[] lines = chunk.split("\n");
          return Flux.fromArray(lines)
            .filter(line -> !line.trim().isEmpty())
            .map(line -> line.replace("data:", "")
              .replace("[DONE]", "")
              .replace("data: [DONE]", "")
              .trim());
        })
        .filter(data -> !data.isEmpty())
        .concatMap(data -> {
          try {
            Map<String, Object> resultObject = new ObjectMapper().readValue(data, Map.class);
            StringBuilder delta = new StringBuilder();
            for (Map<String, Object> choice : (List<Map<String, Object>>) resultObject.get("choices")) {
              Map<String, Object> deltaObj = (Map<String, Object>) choice.getOrDefault("delta", Collections.emptyMap());
              delta.append(deltaObj.getOrDefault("content", ""));
            }
            // sends response back to Deep Chat using the Result format:
            // https://deepchat.dev/docs/connect/#Result
            return Flux.just(new DeepChatTextRespose(delta.toString()));
          } catch (JsonProcessingException e) {
            LOGGER.error("Error when processing a stream chunk: ", e);
            return null;
          }
      });
    } catch (Exception e) {
      LOGGER.error("Error when calling OpenAI API", e);
      return null;
    }
  }

  private static OpenAIChatBody createOpenAIChatBody(DeepChatRequestBody requestBody, Boolean stream) {
    DeepChatRequestMessage[] requestMessages = requestBody.getMessages();
    OpenAIChatMessage[] opneAIChatMessages = new OpenAIChatMessage[requestMessages.length];
    for (int i = 0; i < requestMessages.length; i ++) {
      DeepChatRequestMessage requestMessage = requestMessages[i];
      opneAIChatMessages[i] = new OpenAIChatMessage(requestMessage.getRole(), requestMessage.getText());
    }
    return new OpenAIChatBody(opneAIChatMessages, requestBody.getModel(), stream);
  }
  
  public DeepChatFileResponse imageVariation(@RequestPart("files") List<MultipartFile> files) throws Exception {
    MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
    if (files.size() > 0) {
      org.springframework.web.multipart.MultipartFile imageFile = files.get(0);
      formData.add("image", imageFile.getResource());
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    headers.set("Authorization", "Bearer " + openAIAPIKey);
    HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(formData, headers);
    RestTemplate restTemplate = new RestTemplate();
    String url = "https://api.openai.com/v1/images/variations";
    try {
      // send the request to openAI
      ResponseEntity<OpenAIImageResult> responseEntity = restTemplate.exchange(url, HttpMethod.POST, requestEntity, OpenAIImageResult.class);

      if (responseEntity.getStatusCode() == HttpStatus.OK) {
        OpenAIImageResult responseData = responseEntity.getBody();
        if (responseData == null) throw new Exception("Unexpected response from OpenAI");
        return new DeepChatFileResponse(Arrays.asList(new DeepChatFile(responseData.getData()[0].getUrl(), "image")));
      }
    } catch (Exception e) {
      LOGGER.error("Error when calling OpenAI API", e);
      throw new Exception(e);
    }
    return null;
  }
}
