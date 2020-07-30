import React from 'react'
import styles from './box.module.scss'

export const Box = () => (
	<div className={styles.box}>
		Box

		<div className="flex">
			<span className="blue">
				Blue
			</span>
			<span className="blue green">
				Green
			</span>
		</div>
	</div>
)
