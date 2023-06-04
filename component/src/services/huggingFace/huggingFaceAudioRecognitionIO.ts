import {HuggingFaceAudioRecognitionResult} from '../../types/huggingFaceResult';
import {HuggingFaceFileIO} from './huggingFaceFileIO';
import {HuggingFace} from '../../types/huggingFace';
import {AiAssistant} from '../../aiAssistant';
import {PollResult} from '../serviceIO';

export class HuggingFaceAudioRecognitionIO extends HuggingFaceFileIO {
  constructor(aiAssistant: AiAssistant) {
    const config = aiAssistant.service?.huggingFace?.audioSpeechRecognition as NonNullable<
      HuggingFace['audioSpeechRecognition']
    >;
    const defaultFile = {audio: {}};
    super(aiAssistant, 'Attach an audio file', 'facebook/wav2vec2-large-960h-lv60-self', config, defaultFile);
  }

  async extractPollResultData(result: HuggingFaceAudioRecognitionResult): PollResult {
    if (result.estimated_time) return {timeoutMS: (result.estimated_time + 1) * 1000};
    if (result.error) throw result.error;
    return {text: result.text || ''};
  }
}
