/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule warning
 */

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */
type CustomWarning = (() => void) | ((condition: boolean, format: string, ...rest: string[]) => void);

let warning: CustomWarning = () => {
    // Empty function
}

if ("production" !== process.env.NODE_ENV) {
  warning = function(condition, format, ...rest) {
    if (!format) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning message argument'
      );
    }

    if (!condition) {
      let index = 0;
      // eslint-disable-next-line no-console
      console.warn(`Warning: ${format.replace(/%s/g, () => rest[index++])}`);
    }
  };
}

export default warning;
