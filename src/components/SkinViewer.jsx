import defaultSkin from '../../NuelNexus.png'
import './SkinViewer.css'

export default function SkinViewer() {
  return (
    <div className="skin-viewer" style={{ '--skin': `url("${defaultSkin}")` }}>
      <div className="container1">
        <div className="container3d">
          <div className="scene" data-skin="url">
            <div className="head">
              <div id="head-front" />
              <div id="head-back" />
              <div id="head-left" />
              <div id="head-right" />
              <div id="head-top" />
              <div id="head-bottom" />
            </div>
            <div className="body">
              <div id="body-front" />
              <div id="body-back" />
              <div id="body-left" />
              <div id="body-right" />
              <div id="body-bottom" />
            </div>
            <div className="slim left-slim-arm">
              <div id="left-slim-arm-front" />
              <div id="left-slim-arm-back" />
              <div id="left-slim-arm-left" />
              <div id="left-slim-arm-top" />
              <div id="left-slim-arm-bottom" />
            </div>
            <div className="slim right-slim-arm">
              <div id="right-slim-arm-front" />
              <div id="right-slim-arm-back" />
              <div id="right-slim-arm-right" />
              <div id="right-slim-arm-top" />
              <div id="right-slim-arm-bottom" />
            </div>
            <div className="left-leg">
              <div id="left-leg-front" />
              <div id="left-leg-back" />
              <div id="left-leg-left" />
              <div id="left-leg-top" />
              <div id="left-leg-bottom" />
            </div>
            <div className="right-leg">
              <div id="right-leg-front" />
              <div id="right-leg-back" />
              <div id="right-leg-right" />
              <div id="right-leg-top" />
              <div id="right-leg-bottom" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
