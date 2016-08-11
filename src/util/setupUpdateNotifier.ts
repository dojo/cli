import * as updateNotifier from 'update-notifier';

export default function (pkg: any, updateCheckInterval: number = 0) {
	const notifier = updateNotifier({ pkg, updateCheckInterval });
	notifier.notify();
}
