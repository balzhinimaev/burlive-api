export default function isValidObjectIdString(input: string | Uint8Array | number): boolean {
    if (typeof input === 'string' && /^[0-9a-fA-F]{24}$/.test(input)) {
      return true;
    } else if (input instanceof Uint8Array && input.length === 12) {
      return true;
    } else if (typeof input === 'number' && Number.isInteger(input)) {
      return true;
    } else {
      return false;
    }
  }
  