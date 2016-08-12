import * as updateNotifier from 'update-notifier';

export default function setupUpdatNotifier(pkg: any, updateCheckInterval: number = 0) {
	const notifier = updateNotifier({ pkg, updateCheckInterval });
	notifier.notify();
}
