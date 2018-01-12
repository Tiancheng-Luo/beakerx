/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as _ from 'underscore';

const dialog = require('base/js/dialog');
const utils = require('base/js/utils');

export default class GistPublishModal {
  static template = _.template(require('./modalTemplate.html'))();
  static settingsUrl = `${(Jupyter.notebook_list || Jupyter.notebook).base_url}beakerx/settings`;

  static show(submitCallback: Function): void {
    GistPublishModal.getGithubPersonalAccessToken()
      .then(personalAccessToken => {
        GistPublishModal.create(submitCallback, personalAccessToken);
      });
  }

  static create(submitCallback, personalAccessToken = '') {
    const modalContent = GistPublishModal.createModalContent();
    const personalAccessTokenInput = modalContent.querySelector('input');

    if (personalAccessTokenInput) {
      personalAccessTokenInput.value = personalAccessToken;
    }

    dialog.modal({
      title : 'Publish to a Github Gist',
      body : modalContent,
      buttons: {
        'Publish': {
          'class' : 'btn-primary',
          'click': () => {
            const personalAccessToken = personalAccessTokenInput ? personalAccessTokenInput.value : '';

            submitCallback(personalAccessToken);
            GistPublishModal.storePersonalAccessToken(personalAccessToken);
          }
        },
        'Cancel': {}
      }
    });
  }

  static createModalContent(): HTMLElement {
    const modalContent = document.createElement('div');

    modalContent.innerHTML = GistPublishModal.template;

    const input = modalContent.querySelector('input');
    const keyboardManagerEnabled = Jupyter.notebook.keyboard_manager.enabled;

    if (input) {
      input.onfocus = () => { Jupyter.notebook.keyboard_manager.enabled = false; };
      input.onblur = () => { Jupyter.notebook.keyboard_manager.enabled = keyboardManagerEnabled; };
    }

    return modalContent;
  }

  static storePersonalAccessToken(githubPersonalAccessToken = ''): Promise<any> {
    return GistPublishModal.getStoredSettings()
      .then(storedSettings =>
        utils.ajax(GistPublishModal.settingsUrl, {
          type: 'POST',
          data: JSON.stringify({
            ...storedSettings,
            githubPersonalAccessToken
          })
        })
      );
  }

  static getGithubPersonalAccessToken(): Promise<any> {
    return GistPublishModal.getStoredSettings()
      .then(settings => settings.githubPersonalAccessToken || '');
  }

  static getStoredSettings(): Promise<any> {
    return utils.ajax(GistPublishModal.settingsUrl, {
      method: 'GET'
    });
  }
}
