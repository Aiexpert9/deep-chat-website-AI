package com.server.basic;

import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import com.server.utils.deepChat.DeepChatRequestBody;
import com.server.utils.deepChat.DeepChatTextRespose;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;
import org.springframework.http.MediaType;
import com.server.utils.PrintObjectUtil;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import org.slf4j.Logger;
import java.util.List;
import java.util.Map;

@Service
public class BasicService {
  private static final Logger LOGGER = LoggerFactory.getLogger(BasicService.class);

  public DeepChatTextRespose chat(DeepChatRequestBody requestBody) {
    // Text messages are stored inside request body using the Deep Chat JSON format:
    // https://deepchat.dev/docs/connect
    LOGGER.info("Received request body: {}", PrintObjectUtil.toJsonString(requestBody));
    // Sends response back to Deep Chat using the Result format:
    // https://deepchat.dev/docs/connect/#Result
    return new DeepChatTextRespose("This is a response from a Java server. Thank you for your message!");
  }

  public void chatStream(DeepChatRequestBody requestBody, HttpServletResponse response) throws IOException {
    // Text messages are stored inside request body using the Deep Chat JSON format:
    // https://deepchat.dev/docs/connect
    LOGGER.info("Received request body: {}", PrintObjectUtil.toJsonString(requestBody));

    String[] responseChunks = "This is a response from a Java server. Thank you for your message!".split(" ");

    response.setContentType(MediaType.TEXT_EVENT_STREAM_VALUE);
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("Access-Control-Allow-Origin", "*");

    sendStream(response, responseChunks, 0);
  }

  private void sendStream(HttpServletResponse response, String[] responseChunks, int chunkIndex) throws IOException {
    if (chunkIndex < responseChunks.length) {
      String chunk = responseChunks[chunkIndex];
      // Sends response back to Deep Chat using the Result format:
      // https://deepchat.dev/docs/connect/#Result
      response.getWriter().write("data: " + "{\"result\": {\"text\": \"" + chunk + " \"}}\n\n");
      response.flushBuffer();
      try {
        Thread.sleep(70); // Introduce the desired delay in milliseconds
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
      sendStream(response, responseChunks, chunkIndex + 1);
    } else {
      response.getWriter().close();
    }
  }

  public DeepChatTextRespose files(@RequestPart("files") List<MultipartFile> files, Map<String, String> formDataProperties) {
    // Files are stored inside a form using Deep Chat request FormData format:
    // https://deepchat.dev/docs/connect
    if (!files.isEmpty()) {
      System.out.println("Files:");
      for (MultipartFile file : files) {
        String fileName = file.getOriginalFilename();
        System.out.println(fileName);
      }
      // When sending text along with files, they are stored inside the request body using the Deep Chat JSON format:
      // https://deepchat.dev/docs/connect
      if (!formDataProperties.isEmpty()) {
        System.out.println("Text messages:");
        for (Map.Entry<String, String> entry : formDataProperties.entrySet()) {
          String propertyName = entry.getKey();
          String propertyValue = entry.getValue();
          System.out.println(propertyName + ": " + propertyValue);
        }
      }
    }
    // Sends response back to Deep Chat using the Result format:
    // https://deepchat.dev/docs/connect/#Result
    return new DeepChatTextRespose("This is a response from a Java server. Thank you for your message!");
  }
}
