/*
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  CliCommandExecutor,
  SfdxCommandBuilder
} from '@salesforce/salesforcedx-utils-vscode/out/src/cli';
import * as path from 'path';
import * as vscode from 'vscode';
import { channelService } from '../channels';
import { nls } from '../messages';
import { notificationService } from '../notifications';
import { CancellableStatusBar, taskViewService } from '../statuses';

export function forceOrgCreate() {
  vscode.workspace.findFiles('config/*.json', '').then(files => {
    const fileItems: vscode.QuickPickItem[] = files.map(file => {
      return {
        label: path.basename(file.toString()),
        description: file.fsPath
      };
    });
    vscode.window.showQuickPick(fileItems).then(selection => {
      if (selection) {
        const cancellationTokenSource = new vscode.CancellationTokenSource();
        const cancellationToken = cancellationTokenSource.token;

        const rootPath = vscode.workspace.rootPath!;
        const selectionPath = path.relative(
          rootPath,
          selection.description.toString()
        );
        const execution = new CliCommandExecutor(
          new SfdxCommandBuilder()
            .withDescription(
              nls.localize('force_org_create_default_scratch_org_text')
            )
            .withArg('force:org:create')
            .withFlag('-f', `${selectionPath}`)
            .withArg('--setdefaultusername')
            .build(),
          { cwd: rootPath }
        ).execute(cancellationToken);

        channelService.streamCommandOutput(execution);
        notificationService.reportCommandExecutionStatus(
          execution,
          cancellationToken
        );
        CancellableStatusBar.show(execution, cancellationTokenSource);
        taskViewService.addCommandExecution(execution, cancellationTokenSource);
      }
    });
  });
}
