import {AudioFileAttachmentType} from '../../fileAttachments/fileAttachmentTypes/audioFileAttachmentType';
import {RecordAudioFilesServiceConfig} from '../../../../../types/fileServiceConfigs';
import {NewFileName} from '../../fileAttachments/newFileName';
import {AudioFormat} from '../../../../../types/microphone';
import {MicrophoneButton} from './microphoneButton';

export class RecordAudio extends MicrophoneButton {
  private _mediaRecorder?: MediaRecorder;
  private _mediaStream?: MediaStream;
  private readonly _audioType: AudioFileAttachmentType;
  private readonly _extension: AudioFormat;
  private readonly _maxDurationSeconds?: number;
  private readonly _newFilePrefix?: string;

  constructor(audioType: AudioFileAttachmentType, recordAudioConfig: RecordAudioFilesServiceConfig) {
    super(recordAudioConfig.button);
    this._audioType = audioType;
    this._extension = recordAudioConfig.files?.format || 'mp3';
    this._maxDurationSeconds = recordAudioConfig.files?.maxDurationSeconds;
    this.elementRef.onclick = this.buttonClick.bind(this);
    // this._newFilePrefix = recordAudioConfig.files?.newFilePrefix; // can implement in the future
  }

  private buttonClick() {
    if (this.isActive) {
      this.stop();
    } else {
      this.record();
      this.changeToActive();
    }
  }

  private stop(): Promise<void> {
    return new Promise((resolve) => {
      this.changeToDefault();
      this._mediaRecorder?.stop(); // may not be required
      this._mediaStream?.getTracks().forEach((track) => track.stop()); // necessary to remove tab bubble
      setTimeout(() => {
        resolve();
      }, 10);
    });
  }

  private record() {
    navigator.mediaDevices
      .getUserMedia({audio: true})
      .then((stream) => {
        this._mediaRecorder = new MediaRecorder(stream);
        this._audioType.addPlaceholderAttachment(this.stop.bind(this), this._maxDurationSeconds);
        this._mediaStream = stream;
        // fired on recording stop
        this._mediaRecorder.addEventListener('dataavailable', (event) => {
          this.createFile(event);
        });
        this._mediaRecorder.start();
      })
      .catch((err) => {
        console.error(err);
        this.stop();
      });
  }

  private createFile(event: BlobEvent) {
    const blob = new Blob([event.data], {type: `audio/${this._extension}`});
    const filename = NewFileName.getFileName(this._newFilePrefix || 'audio', this._extension);
    const file = new File([blob], filename, {type: blob.type});
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      this._audioType.completePlaceholderAttachment(file, (event.target as FileReader).result as string);
    };
  }
}
