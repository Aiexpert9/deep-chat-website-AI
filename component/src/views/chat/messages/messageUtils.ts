import {MessageContentI} from '../../../types/messagesInternal';
import {MessageContent} from '../../../types/messages';
import {MessageElements} from './messages';

export class MessageUtils {
  public static readonly AI_ROLE = 'ai';
  public static readonly USER_ROLE = 'user';

  public static getLastElementsByClass(messagesElements: MessageElements[], classes: string[], avoidedClasses?: string[]) {
    for (let i = messagesElements.length - 1; i >= 0; i -= 1) {
      const elements = messagesElements[i];
      if (elements.bubbleElement.classList.contains(classes[0])) {
        const notFound = classes.slice(1).find((className) => !elements.bubbleElement.classList.contains(className));
        if (!notFound) {
          if (avoidedClasses) {
            const avoided = avoidedClasses.find((className) => elements.bubbleElement.classList.contains(className));
            if (!avoided) return elements;
          } else {
            return elements;
          }
        }
      }
    }
    return undefined;
  }

  public static getLastMessage(messages: MessageContentI[], role: string, content?: keyof Omit<MessageContent, 'role'>) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === role) {
        if (content) {
          if (messages[i][content]) return messages[i];
        } else {
          return messages[i];
        }
      }
    }
    return undefined;
  }

  public static getLastTextToElement(elemsToText: [MessageElements, string][], elems: MessageElements) {
    for (let i = elemsToText.length - 1; i >= 0; i -= 1) {
      if (elemsToText[i][0] === elems) {
        return elemsToText[i];
      }
    }
    return undefined;
  }

  // prettier-ignore
  public static overwriteMessage(messages: MessageContentI[], messagesElements: MessageElements[],
      content: string, role: string, contentType: 'text' | 'html', className: string) {
    // not sure if loading-message-text is needed
    const elements = MessageUtils.getLastElementsByClass(
      messagesElements, [MessageUtils.getRoleClass(role), className], ['loading-message-text']);
    const lastMessage = MessageUtils.getLastMessage(messages, role, contentType);
    if (lastMessage) lastMessage[contentType] = content;
    return elements;
  }

  public static getRoleClass(role: string) {
    return `${role}-message`;
  }
}
