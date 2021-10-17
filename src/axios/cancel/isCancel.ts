'use strict';

import { Cancel } from "../type";

export default function isCancel(value: any): value is Cancel {
  return !!(value && value.__CANCEL__);
};
