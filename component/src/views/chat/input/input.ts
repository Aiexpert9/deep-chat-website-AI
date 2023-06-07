import {AudioFileAttachmentType} from './fileAttachments/fileAttachmentTypes/audioFileAttachmentType';
import {InputButtonStyleAdjustments} from './buttons/styleAdjustments/inputButtonStyleAdjustments';
import {FileAttachmentsType} from './fileAttachments/fileAttachmentTypes/fileAttachmentsType';
import {FileServiceIO, ServiceFileTypes, ServiceIO} from '../../../services/serviceIO';
import {InputButtonPositions} from './buttons/styleAdjustments/inputButtonPositions';
import {FILE_TYPE_BUTTON_ICONS} from '../../../utils/fileTypes/fileTypeButtonIcons';
import {UploadFileButton} from './buttons/uploadFile/uploadFileButton';
import {DragAndDrop} from './fileAttachments/dragAndDrop/dragAndDrop';
import {ButtonContainers} from './buttonContainers/buttonContainers';
import {FileAttachments} from './fileAttachments/fileAttachments';
import {ElementUtils} from '../../../utils/element/elementUtils';
import {SpeechToText} from './buttons/microphone/speechToText';
import {RecordAudio} from './buttons/microphone/recordAudio';
import {SubmitButton} from './buttons/submit/submitButton';
import {CameraButton} from './buttons/camera/cameraButton';
import {DropupStyles} from '../../../types/dropupStyles';
import {BUTTON_TYPES} from '../../../types/buttonTypes';
import {InputButton} from './buttons/inputButton';
import {CustomStyle} from '../../../types/styles';
import {TextInputEl} from './textInput/textInput';
import {Messages} from '../messages/messages';
import {DeepChat} from '../../../deepChat';

type Buttons = {
  [key in BUTTON_TYPES]?: {button: InputButton; fileType?: FileAttachmentsType};
};

export class Input {
  readonly elementRef: HTMLElement;

  // prettier-ignore
  constructor(deepChat: DeepChat, messages: Messages, serviceIO: ServiceIO, containerElement: HTMLElement) {
    this.elementRef = Input.createPanelElement(deepChat.inputAreaStyle);
    const textInput = new TextInputEl(serviceIO, deepChat.textInput);
    const buttons: Buttons = {};
    const fileAttachments = this.createFileUploadComponents(deepChat, serviceIO, containerElement, buttons);
    if (deepChat.speechToTextInput && !buttons.microphone) {
      buttons.microphone = {button: new SpeechToText(
        deepChat.speechToTextInput, textInput, messages.addNewErrorMessage.bind(messages))};
    }
    const submitButton = new SubmitButton(deepChat, textInput.inputElementRef, messages, serviceIO, fileAttachments);
    textInput.submit = submitButton.submitFromInput.bind(submitButton);
    deepChat.submitUserMessage = submitButton.submit.bind(submitButton);
    buttons.submit = {button: submitButton};
    Input.addElements(this.elementRef, textInput, buttons, containerElement, fileAttachments, deepChat.dropupStyles);
  }

  private static createPanelElement(customStyle?: CustomStyle) {
    const panelElement = document.createElement('div');
    panelElement.id = 'input';
    Object.assign(panelElement.style, customStyle);
    return panelElement;
  }

  // prettier-ignore
  private createFileUploadComponents(
      deepChat: DeepChat, serviceIO: ServiceIO, containerElement: HTMLElement, buttons: Buttons) {
    const fileAttachments = new FileAttachments(this.elementRef, deepChat.attachmentContainerStyle, serviceIO.demo);
    Input.createUploadButtons(serviceIO.fileTypes || {}, fileAttachments, containerElement, buttons);
    if (serviceIO.camera?.files) {
      const cameraType = buttons.images?.fileType || fileAttachments.addType(serviceIO.camera.files, 'images');
      buttons.camera = {button: new CameraButton(containerElement, cameraType, serviceIO.camera)};
    }
    if (serviceIO.recordAudio?.files) {
      const audioType = buttons.audio?.fileType || fileAttachments.addType(serviceIO.recordAudio.files, 'audio');
      buttons.microphone = {button: new RecordAudio(audioType as AudioFileAttachmentType, serviceIO.recordAudio)};
    }
    if (DragAndDrop.isEnabled(fileAttachments, deepChat.dragAndDrop)) {
      DragAndDrop.create(containerElement, fileAttachments, deepChat.dragAndDrop);
    }
    return fileAttachments;
  }

  // prettier-ignore
  private static createUploadButtons(
      fileTypes: ServiceFileTypes, fileAtt: FileAttachments, containerEl: HTMLElement, buttons: Buttons) {
    Object.keys(fileTypes).forEach((key) => {
      const fileType = key as keyof ServiceFileTypes;
      const fileService = fileTypes[fileType] as FileServiceIO;
      if (fileService.files) {
        const fileAttachmentsType = fileAtt.addType(fileService.files, fileType);
        const {id, svgString, dropupText} = FILE_TYPE_BUTTON_ICONS[fileType];
        const button = new UploadFileButton(containerEl, fileAttachmentsType, fileService, id, svgString, dropupText);
        buttons[fileType] = {button, fileType: fileAttachmentsType};
      }
    });
  }

  // prettier-ignore
  private static addElements(panel: HTMLElement, textInput: TextInputEl, buttons: Buttons, container: HTMLElement,
      fileAttachments: FileAttachments, dropupStyles?: DropupStyles) {
    ElementUtils.addElements(panel, textInput.elementRef);
    const buttonContainers = ButtonContainers.create();
    const positions = InputButtonPositions.addButtons(buttonContainers, buttons, container, dropupStyles);
    InputButtonStyleAdjustments.set(textInput.inputElementRef, buttonContainers, fileAttachments.elementRef, positions);
    ButtonContainers.add(panel, buttonContainers);
  }
}
