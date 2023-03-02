import {EventSourceMessage, fetchEventSource} from '@microsoft/fetch-event-source';
import {ErrorMessages} from '../errorMessages/errorMessages';
import {Messages} from '../../views/chat/messages/messages';
import {CompletionResult} from '../../types/openAIResult';
import {OpenAICompletions} from '../../types/openAI';

// WORK - need error handling for both
export class OpenAIClient {
  private static readonly _completions_url = 'https://api.openai.com/v1/completions';
  private static readonly _models_url = 'https://api.openai.com/v1/models';

  private static buildCompletionsHeaders(key: string) {
    return {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  private static buildCompletionsBody(params: OpenAICompletions, prompt: string) {
    return JSON.stringify({prompt, ...params});
  }

  // prettier-ignore
  public static requestCompletion(params: OpenAICompletions, key: string, prompt: string,
      messages: Messages, onSuccessfulResult: () => void) {
    fetch(OpenAIClient._completions_url, {
      method: 'POST',
      headers: new Headers(OpenAIClient.buildCompletionsHeaders(key)),
      body: OpenAIClient.buildCompletionsBody(params, prompt),
    })
      .then((response) => response.json())
      .then((result: CompletionResult) => {
        const text = result.choices[0].text;
        messages.addNewMessage(text, true);
        onSuccessfulResult();
      })
      .catch((err) => console.error(err));
  }

  // prettier-ignore
  public static requestStreamCompletion(params: OpenAICompletions, key: string, prompt: string, messages: Messages,
      onOpen: () => void, onClose: () => void, abortStream: AbortController) {
    let textElement: HTMLElement | null = null;
    fetchEventSource(OpenAIClient._completions_url, {
      method: 'POST',
      headers: OpenAIClient.buildCompletionsHeaders(key),
      body: OpenAIClient.buildCompletionsBody(params, prompt),
      openWhenHidden: true, // keep stream open when browser tab not open
      async onopen(response: Response) {
        if (response.ok) {
          textElement = messages.addNewStreamedMessage();
          return onOpen();
        }
        throw new Error('error');
      },
      onmessage(message: EventSourceMessage) {
        if (JSON.stringify(message.data) !== JSON.stringify('[DONE]')) {
          const response = JSON.parse(message.data) as unknown as CompletionResult;
          const text = response.choices[0].text;
          if (textElement) Messages.updateStreamedMessage(text, textElement);
        }
      },
      onerror(err) {
        console.error(err);
        throw new Error('error'); // need to throw otherwise stream will retry infinitely
      },
      onclose() {
        onClose();
      },
      signal: abortStream.signal,
    });
  }

  // prettier-ignore
  public static verifyKey(inputElement: HTMLInputElement,
      onSuccess: (key: string) => void, onFail: (message: string) => void, onLoad: () => void) {
    const key = inputElement.value.trim();
    if (key === '') return onFail(ErrorMessages.INVALID_KEY);
    onLoad();
    fetch(OpenAIClient._models_url, {
      method: 'GET',
      headers: new Headers(OpenAIClient.buildCompletionsHeaders(inputElement.value.trim())),
      body: null,
    })
      .then((response) => response.json())
      .then((result: CompletionResult) => {
        if (result.error) {
          if (result.error.code === 'invalid_api_key') {
            onFail(ErrorMessages.INVALID_KEY);
          } else {
            onFail(ErrorMessages.CONNECTION_FAILED);
          }
        } else {
          onSuccess(key);
        }
      })
      .catch((err) => {
        onFail(ErrorMessages.CONNECTION_FAILED);
        console.error(err);
      });
  }
}
