export class FileStreamStats {
  private readonly totalBytes: number
  private readonly startTime: number

  private transferredBytes: number = 0
  private lastUpdateTime: number
  private rateMbps: number = 0

  constructor(totalBytes: number) {
    this.totalBytes = totalBytes
    this.startTime = Date.now()
    this.lastUpdateTime = this.startTime
  }

  update(bytesDiff: number) {
    const now = Date.now()
    const timeDiff = (now - this.lastUpdateTime) / 1000 // seconds

    if (timeDiff > 0) {
      this.rateMbps = (bytesDiff * 8) / (timeDiff * 1024 * 1024) // Mbps
    }
    this.lastUpdateTime = now
    this.transferredBytes += bytesDiff
  }

  getPercentComplete(): number {
    return Math.round((this.transferredBytes / this.totalBytes) * 1000) / 10
  }

  getRateMbps(): number {
    return this.rateMbps
  }

  getEstimatedTimeRemaining(): number {
    if (this.rateMbps > 0) {
      return ((this.totalBytes - this.transferredBytes) * 8) / (this.rateMbps * 1024 * 1024)
    }

    return Infinity
  }
}
