package io.github.skiplock.talerz

import android.os.Bundle
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity

/** Shown by Health Connect when the user asks why Talerz wants access to health data. */
class PermissionsRationaleActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = (24 * resources.displayMetrics.density).toInt()
        val text = TextView(this).apply {
            text = getString(R.string.privacy_text)
            textSize = 16f
            setLineSpacing(0f, 1.25f)
            setTextColor(getColor(R.color.ink))
            setPadding(pad, pad * 2, pad, pad)
        }
        val scroll = ScrollView(this).apply {
            setBackgroundColor(getColor(R.color.bg))
            addView(text)
        }
        setContentView(scroll)
    }
}
