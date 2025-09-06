export class LineAnimation {
    animIndex = 0;
    animations = [".  ", ".. ", "...", " ..", "  .", "   ",];
    lastMsgLenght = this.animations.length;

    writeStateLine(msg?: string) {
        this.cleanStateLine();
        const s = ` ${this.animations[++this.animIndex % this.animations.length]} ${msg || ''} \r`;
        this.lastMsgLenght = s.length;
        process.stdout.write(s);
    }

    cleanStateLine() {
        process.stdout.write(`${' '.repeat(this.lastMsgLenght)}\r`);
        this.lastMsgLenght = 0;
    }
}
