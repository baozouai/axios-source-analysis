'use strict';

import { Cancel } from "../type";

export default function isCancel(value: any): value is Cancel {
  // 这里为何不写value instanceof Cancel(./Cancel.ts)
  return !!(value && value.__CANCEL__);
};
