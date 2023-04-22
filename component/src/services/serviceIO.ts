import {ValidateMessageBeforeSending} from '../types/validateMessageBeforeSending';
import {ButtonElementStyles, GenericButton} from '../types/button';
import {RequestInterceptor} from '../types/requestInterceptor';
import {RequestSettings} from '../types/requestSettings';
import {Messages} from '../views/chat/messages/messages';
import {FilesServiceConfig} from '../types/fileService';
import {ImageResults} from '../types/imageResult';

export interface CompletionsHandlers {
  onFinish: () => void;
}

export interface StreamHandlers {
  onOpen: () => void;
  onClose: () => void;
  abortStream: AbortController;
}

export interface KeyVerificationHandlers {
  onSuccess: (key: string) => void;
  onFail: (message: string) => void;
  onLoad: () => void;
}

export type ImagesConfig = FilesServiceConfig & {
  infoModalTextMarkUp?: string;
  button?: GenericButton & {default?: ButtonElementStyles};
};

export type CustomErrors = Set<string>;

export interface ServiceIO {
  url?: string;

  images?: ImagesConfig;

  requestSettings?: RequestSettings;

  introPanelMarkUp?: string;

  // the reason why we use a Set of prefixes to allow certain errors is because some errors can change
  // depending on the input e.g. incorrect image dimensions or formatting, hence we identify the permitted
  // service errors via prefixes
  permittedErrorPrefixes?: CustomErrors;

  requestInterceptor: RequestInterceptor;

  canSendMessage: ValidateMessageBeforeSending;

  verifyKey(inputElement: HTMLInputElement, keyVerificationHandlers: KeyVerificationHandlers): void;

  // prettier-ignore
  callApi(messages: Messages, completionsHandlers: CompletionsHandlers, streamHandlers: StreamHandlers,
    files?: File[]): void;

  extractResultData(result: object): string | ImageResults;
}
