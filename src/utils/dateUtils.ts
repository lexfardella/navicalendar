// dateUtils.ts

export function toUTC(date: Date): Date {
    return new Date(date.toUTCString());
  }
  
  export function fromUTC(date: Date, timeZone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone }));
  }
  
  export function parseDateString(dateString: string | undefined): Date {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : toUTC(date);
  }
  
  export function formatDateToString(date: Date | string): string {
    if (typeof date === 'string') {
      return toUTC(new Date(date)).toUTCString();
    }
    return date.toUTCString();
  }