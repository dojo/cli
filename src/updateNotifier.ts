import * as updateNotifier from 'update-notifier';

export default function setupUpdateNotifier(pkg: any, updateCheckInterval: number = 0) {
	const notifier = updateNotifier({ pkg, updateCheckInterval });
	notifier.notify();
}
